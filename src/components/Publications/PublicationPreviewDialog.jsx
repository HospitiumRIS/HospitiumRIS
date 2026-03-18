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
    Chip,
    Divider,
    CircularProgress,
    Alert,
    IconButton,
    Link,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Close as CloseIcon,
    Visibility as PreviewIcon,
    Download as ImportIcon,
    OpenInNew as OpenInNewIcon,
    AutoAwesome as AIIcon,
    Folder as FolderIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import LibrarySelectionModal from './LibrarySelectionModal';

/**
 * PublicationPreviewDialog - Shows publication details before importing
 */
const PublicationPreviewDialog = ({ 
    open, 
    onClose, 
    publication, 
    onImport,
    importing = false
}) => {
    const [error, setError] = useState(null);
    const [aiSummary, setAiSummary] = useState(null);
    const [aiKeywords, setAiKeywords] = useState([]);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [selectedLibrary, setSelectedLibrary] = useState('');
    const [selectedLibraryName, setSelectedLibraryName] = useState('');
    const [libraryModalOpen, setLibraryModalOpen] = useState(false);
    const [localFolderAssociations, setLocalFolderAssociations] = useState({});
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [importedPublicationTitle, setImportedPublicationTitle] = useState('');
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [checkingDuplicate, setCheckingDuplicate] = useState(false);

    // Check for duplicate publication when dialog opens
    useEffect(() => {
        const checkDuplicate = async () => {
            if (!open || !publication) {
                setIsDuplicate(false);
                return;
            }

            setCheckingDuplicate(true);
            try {
                const params = new URLSearchParams({
                    checkDuplicate: 'true',
                    ...(publication.doi && { doi: publication.doi }),
                    ...(publication.pubmedId && { pubmedId: publication.pubmedId }),
                    ...(publication.title && { title: publication.title }),
                    ...(publication.year && { year: publication.year.toString() })
                });

                const response = await fetch(`/api/publications/import?${params}`);
                const data = await response.json();
                
                setIsDuplicate(data.exists);
            } catch (error) {
                console.error('Error checking for duplicate:', error);
                setIsDuplicate(false);
            } finally {
                setCheckingDuplicate(false);
            }
        };

        checkDuplicate();
    }, [open, publication]);

    // Generate AI summary when dialog opens
    useEffect(() => {
        if (open && publication) {
            // Only generate if there's an abstract or title
            if (publication.abstract || publication.title) {
                generateAISummary();
            }
        }
    }, [open, publication]);

    // Reset state only when dialog closes
    useEffect(() => {
        if (!open) {
            setSelectedLibrary('');
            setSelectedLibraryName('');
            setAiSummary(null);
            setAiKeywords([]);
            setAiError(null);
            setLocalFolderAssociations({});
        }
    }, [open]);

    const handleLibrarySelect = (folderId, folderName) => {
        setSelectedLibrary(folderId);
        setSelectedLibraryName(folderName);
    };

    const handleAddToFolder = (folderId) => {
        // Add publication to folder locally (before database persistence)
        console.log('handleAddToFolder called:', {
            folderId,
            publicationId: publication.id,
            publicationTitle: publication.title
        });
        
        setLocalFolderAssociations(prev => {
            const folderPubs = prev[folderId] || [];
            // Check if publication already added to this folder
            if (folderPubs.some(pub => pub.id === publication.id)) {
                console.log('Publication already in folder, skipping');
                return prev; // Already added
            }
            const updated = {
                ...prev,
                [folderId]: [...folderPubs, publication]
            };
            console.log('Updated localFolderAssociations:', updated);
            return updated;
        });
    };

    const generateAISummary = async () => {
        setGeneratingAI(true);
        setAiError(null);

        try {
            const response = await fetch('/api/ai/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    publications: [{
                        id: publication.id,
                        title: publication.title,
                        abstract: publication.abstract
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate AI summary');
            }

            const { results } = await response.json();
            
            if (results && results.length > 0 && results[0].success) {
                setAiSummary(results[0].summary);
                setAiKeywords(results[0].keywords || []);
            } else {
                throw new Error(results[0]?.error || 'Failed to generate summary');
            }
        } catch (err) {
            console.error('Error generating AI summary:', err);
            setAiError(err.message || 'Failed to generate AI summary');
        } finally {
            setGeneratingAI(false);
        }
    };

    if (!publication) return null;

    const handleImport = async () => {
        try {
            setError(null);
            // Get all folder IDs from localFolderAssociations
            // Note: We use all keys because the publication might not have an ID yet (it gets one after import)
            const folderIds = Object.keys(localFolderAssociations);
            
            console.log('PublicationPreviewDialog - handleImport:', {
                publicationId: publication.id,
                publicationTitle: publication.title,
                localFolderAssociations,
                folderIds,
                folderIdsCount: folderIds.length,
                selectedLibrary
            });
            await onImport(publication, selectedLibrary, folderIds);
            // Show success dialog
            setImportedPublicationTitle(publication.title);
            setSuccessDialogOpen(true);
        } catch (err) {
            setError(err.message || 'Failed to import publication');
        }
    };

    const handleCloseSuccessDialog = () => {
        setSuccessDialogOpen(false);
        onClose();
    };

    const handleImportAnother = () => {
        setSuccessDialogOpen(false);
        onClose();
        // Parent component will handle staying on the import page
    };

    const handleManagePublications = () => {
        setSuccessDialogOpen(false);
        onClose();
        window.location.href = '/researcher/publications/manage';
    };

    const formatAuthors = (authors) => {
        if (!authors || !Array.isArray(authors)) return 'Unknown Authors';
        if (authors.length <= 3) return authors.join(', ');
        return `${authors.slice(0, 3).join(', ')} et al.`;
    };

    const formatDate = (year) => {
        if (!year) return 'Unknown Year';
        return year.toString();
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { minHeight: '60vh' }
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PreviewIcon />
                    <span>Preview Publications (1)</span>
                </Box>
                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{ color: 'white' }}
                    title="Close preview"
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
                {/* Table Header */}
                <Box sx={{ 
                    backgroundColor: '#8b6cbc', 
                    color: 'white',
                    px: 3,
                    py: 1
                }}>
                    <Grid container spacing={2}>
                        <Grid size={3}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Title
                            </Typography>
                        </Grid>
                        <Grid size={2.5}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Authors
                            </Typography>
                        </Grid>
                        <Grid size={1}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Year
                            </Typography>
                        </Grid>
                        <Grid size={4}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Journal
                            </Typography>
                        </Grid>
                        <Grid size={1.5}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Type
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>

                {/* Publication Details */}
                <Box sx={{ p: 3, backgroundColor: '#f9f9f9' }}>
                    <Grid container spacing={2}>
                        <Grid size={3}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {publication.title}
                            </Typography>
                        </Grid>
                        <Grid size={2.5}>
                            <Typography variant="body2">
                                {formatAuthors(publication.authors)}
                            </Typography>
                        </Grid>
                        <Grid size={1}>
                            <Typography variant="body2" sx={{ color: '#8b6cbc', fontWeight: 500 }}>
                                {formatDate(publication.year)}
                            </Typography>
                        </Grid>
                        <Grid size={4}>
                            <Typography variant="body2">
                                {publication.journal || 'Unknown Journal'}
                            </Typography>
                            {(publication.volume || publication.issue || publication.pages) && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {publication.volume && `Vol. ${publication.volume}`}
                                    {publication.issue && `, Issue ${publication.issue}`}
                                    {publication.pages && `, pp. ${publication.pages}`}
                                </Typography>
                            )}
                        </Grid>
                        <Grid size={1.5}>
                            <Chip 
                                label="article" 
                                size="small" 
                                sx={{ 
                                    backgroundColor: '#8b6cbc20', 
                                    color: '#8b6cbc',
                                    fontWeight: 500
                                }} 
                            />
                        </Grid>
                    </Grid>
                </Box>

                {/* Additional Details */}
                <Box sx={{ p: 3 }}>
                    {/* AI Summary Section */}
                    <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(139, 108, 188, 0.08)', borderRadius: 1, border: '1px solid rgba(139, 108, 188, 0.2)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <AIIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                                AI Summary
                            </Typography>
                        </Box>
                        
                        {generatingAI ? (
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <CircularProgress size={16} sx={{ color: '#8b6cbc' }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Generating AI summary...
                                    </Typography>
                                </Box>
                            </Box>
                        ) : aiError ? (
                            <Alert 
                                severity={aiError.includes('quota') || aiError.includes('exceeded') ? 'info' : 'warning'} 
                                sx={{ 
                                    backgroundColor: aiError.includes('quota') || aiError.includes('exceeded') 
                                        ? 'rgba(33, 150, 243, 0.1)' 
                                        : 'rgba(255, 152, 0, 0.1)',
                                    '& .MuiAlert-message': {
                                        width: '100%'
                                    }
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                    {aiError.includes('quota') || aiError.includes('exceeded') 
                                        ? 'AI Summary Temporarily Unavailable' 
                                        : 'Unable to Generate AI Summary'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {aiError}
                                </Typography>
                            </Alert>
                        ) : aiSummary ? (
                            <Box>
                                <Box 
                                    sx={{ 
                                        mb: 2,
                                        maxHeight: '400px',
                                        overflowY: 'auto',
                                        pr: 1,
                                        '&::-webkit-scrollbar': {
                                            width: '8px'
                                        },
                                        '&::-webkit-scrollbar-track': {
                                            backgroundColor: 'rgba(0,0,0,0.05)',
                                            borderRadius: '4px'
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                            backgroundColor: '#8b6cbc',
                                            borderRadius: '4px',
                                            '&:hover': {
                                                backgroundColor: '#7b5ca7'
                                            }
                                        },
                                        '& h3': {
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: '#4a4a4a',
                                            marginTop: '1.5rem',
                                            marginBottom: '0.75rem',
                                            '&:first-of-type': {
                                                marginTop: 0
                                            }
                                        },
                                        '& p': {
                                            fontSize: '0.875rem',
                                            lineHeight: 1.7,
                                            color: '#5a5a5a',
                                            marginBottom: '1rem'
                                        },
                                        '& ul': {
                                            marginLeft: '1.5rem',
                                            marginBottom: '1rem',
                                            paddingLeft: 0,
                                            listStyleType: 'none'
                                        },
                                        '& li': {
                                            fontSize: '0.875rem',
                                            lineHeight: 1.7,
                                            color: '#5a5a5a',
                                            marginBottom: '0.75rem',
                                            position: 'relative',
                                            paddingLeft: '1.5rem',
                                            '&:before': {
                                                content: '"•"',
                                                position: 'absolute',
                                                left: 0,
                                                color: '#8b6cbc',
                                                fontWeight: 700
                                            }
                                        },
                                        '& strong': {
                                            fontWeight: 600,
                                            color: '#3a3a3a'
                                        }
                                    }}
                                    dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\\n/g, '\n').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') }}
                                />
                                {aiKeywords && aiKeywords.length > 0 && (
                                    <Box>
                                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                                            AI-Extracted Keywords:
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            {aiKeywords.map((keyword, index) => (
                                                <Chip
                                                    key={index}
                                                    label={keyword}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: '#8b6cbc',
                                                        color: 'white',
                                                        fontWeight: 500,
                                                        '&:hover': {
                                                            backgroundColor: '#7b5ca7'
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No abstract available to generate summary
                            </Typography>
                        )}
                    </Box>

                    {/* Abstract */}
                    {publication.abstract && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#8b6cbc' }}>
                                Abstract
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                {publication.abstract}
                            </Typography>
                        </Box>
                    )}

                    <Divider sx={{ mb: 3 }} />

                    {/* Metadata */}
                    <Grid container spacing={3}>
                        {/* DOI */}
                        {publication.doi && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#8b6cbc' }}>
                                    DOI
                                </Typography>
                                <Link 
                                    href={`https://doi.org/${publication.doi}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ 
                                        color: '#8b6cbc',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                >
                                    {publication.doi}
                                    <OpenInNewIcon fontSize="small" />
                                </Link>
                            </Grid>
                        )}

                        {/* PubMed ID */}
                        {publication.pubmedId && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#8b6cbc' }}>
                                    PubMed ID
                                </Typography>
                                <Link 
                                    href={`https://pubmed.ncbi.nlm.nih.gov/${publication.pubmedId}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{ 
                                        color: '#8b6cbc',
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5,
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                >
                                    {publication.pubmedId}
                                    <OpenInNewIcon fontSize="small" />
                                </Link>
                            </Grid>
                        )}

                        {/* Source */}
                        {publication.source && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#8b6cbc' }}>
                                    Source
                                </Typography>
                                <Chip 
                                    label={publication.source} 
                                    size="small"
                                    sx={{ 
                                        backgroundColor: '#8b6cbc',
                                        color: 'white',
                                        fontWeight: 500
                                    }}
                                />
                            </Grid>
                        )}

                        {/* Country */}
                        {publication.country && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#8b6cbc' }}>
                                    Country
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {publication.country}
                                </Typography>
                            </Grid>
                        )}

                        {/* Funders */}
                        {publication.funders && publication.funders.length > 0 && (
                            <Grid size={12}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#8b6cbc' }}>
                                    Funders
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {publication.funders.map((funder, index) => (
                                        <Chip 
                                            key={index}
                                            label={funder} 
                                            size="small"
                                            sx={{ 
                                                backgroundColor: '#8b6cbc20',
                                                color: '#8b6cbc',
                                                fontWeight: 500
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Grid>
                        )}

                        {/* Keywords */}
                        {publication.keywords && publication.keywords.length > 0 && (
                            <Grid size={12}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#8b6cbc' }}>
                                    Keywords
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {publication.keywords.slice(0, 5).map((keyword, index) => (
                                        <Chip 
                                            key={index}
                                            label={keyword} 
                                            size="small"
                                            variant="outlined"
                                            sx={{ 
                                                borderColor: '#8b6cbc40',
                                                color: '#8b6cbc'
                                            }}
                                        />
                                    ))}
                                    {publication.keywords.length > 5 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                            +{publication.keywords.length - 5} more
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </Box>

                {/* Duplicate Warning */}
                {isDuplicate && (
                    <Box sx={{ px: 3, pb: 2 }}>
                        <Alert 
                            severity="warning" 
                            sx={{ 
                                mb: 2,
                                '& .MuiAlert-icon': {
                                    color: '#ed6c02'
                                }
                            }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                Publication Already Exists
                            </Typography>
                            <Typography variant="caption">
                                This publication is already in your library. Import has been disabled to prevent duplicates.
                            </Typography>
                        </Alert>
                    </Box>
                )}

                {/* Library Selection */}
                <Box sx={{ px: 3, pb: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FolderIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                                Add to My Library
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            size="small"
                            startIcon={<FolderIcon />}
                            onClick={() => setLibraryModalOpen(true)}
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
                                This publication will be imported and added to this library folder.
                            </Typography>
                        </Box>
                    ) : (
                        <Alert severity="info" sx={{ mt: 1 }}>
                            <Typography variant="caption">
                                Please select a library folder to import this publication.
                            </Typography>
                        </Alert>
                    )}
                </Box>

                {/* Error Display */}
                {error && (
                    <Box sx={{ px: 3, pb: 2 }}>
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    </Box>
                )}
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
                    disabled={importing || !selectedLibrary || isDuplicate || checkingDuplicate}
                    startIcon={importing ? <CircularProgress size={16} /> : <ImportIcon />}
                    sx={{
                        backgroundColor: '#8b6cbc',
                        '&:hover': {
                            backgroundColor: '#7b5ca7'
                        },
                        '&.Mui-disabled': {
                            backgroundColor: 'rgba(139, 108, 188, 0.3)',
                            color: 'rgba(255, 255, 255, 0.5)'
                        }
                    }}
                >
                    {checkingDuplicate ? 'Checking...' : 
                     importing ? 'Importing...' : 
                     isDuplicate ? 'Already in Library' : 
                     'Import Publication'}
                </Button>
            </DialogActions>

            {/* Library Selection Modal */}
            <LibrarySelectionModal
                open={libraryModalOpen}
                onClose={() => setLibraryModalOpen(false)}
                onSelect={async (folderId) => {
                    // Add publication to folder locally
                    handleAddToFolder(folderId);
                    // Also set as selected folder for the main import
                    try {
                        const res = await fetch('/api/publications/library');
                        const data = await res.json();
                        if (data.success && data.folders) {
                            const folder = data.folders.find(f => f.id === folderId);
                            if (folder) {
                                handleLibrarySelect(folderId, folder.name);
                            }
                        }
                    } catch (error) {
                        console.error('Error selecting folder:', error);
                        setError('Failed to select folder');
                    }
                    // Don't close the modal - let user add to multiple folders or perform other actions
                }}
                publicationTitle={publication?.title}
                multiplePublications={false}
                publicationCount={1}
                localFolderAssociations={localFolderAssociations}
            />

            {/* Success Dialog */}
            <Dialog
                open={successDialogOpen}
                onClose={handleCloseSuccessDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon />
                    Import Successful!
                </DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        <strong>{importedPublicationTitle}</strong> has been successfully imported to your library.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        What would you like to do next?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={handleImportAnother}
                        sx={{
                            borderColor: '#8b6cbc',
                            color: '#8b6cbc',
                            '&:hover': {
                                borderColor: '#7b5ca7',
                                backgroundColor: 'rgba(139, 108, 188, 0.08)'
                            }
                        }}
                    >
                        Import Another Publication
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleManagePublications}
                        sx={{
                            bgcolor: '#8b6cbc',
                            '&:hover': { bgcolor: '#7b5ca7' }
                        }}
                    >
                        Manage Your Publications
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default PublicationPreviewDialog;
