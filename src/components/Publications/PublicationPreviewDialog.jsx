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
    Folder as FolderIcon
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

    // Generate AI summary when dialog opens
    useEffect(() => {
        if (open && publication) {
            // Only generate if there's an abstract or title
            if (publication.abstract || publication.title) {
                generateAISummary();
            }
        }
        // Reset state when dialog closes
        if (!open) {
            setSelectedLibrary('');
            setSelectedLibraryName('');
            setAiSummary(null);
            setAiKeywords([]);
            setAiError(null);
        }
    }, [open, publication]);

    const handleLibrarySelect = (folderId, folderName) => {
        setSelectedLibrary(folderId);
        setSelectedLibraryName(folderName);
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
            await onImport(publication, selectedLibrary);
        } catch (err) {
            setError(err.message || 'Failed to import publication');
        }
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

                {/* Library Selection */}
                <Box sx={{ px: 3, pb: 2 }}>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
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
                        <Typography variant="caption" color="text.secondary">
                            Click "Select Folder" to add this publication to a library folder after import.
                        </Typography>
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
                    disabled={importing}
                    startIcon={importing ? <CircularProgress size={16} /> : <ImportIcon />}
                    sx={{
                        backgroundColor: '#8b6cbc',
                        '&:hover': {
                            backgroundColor: '#7b5ca7'
                        }
                    }}
                >
                    {importing ? 'Importing...' : 'Import Publications'}
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
                publicationTitle={publication?.title}
                multiplePublications={false}
                publicationCount={1}
            />
        </Dialog>
    );
};

export default PublicationPreviewDialog;
