'use client';

import { useTranslation } from 'react-i18next';
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
    Stack,
    alpha
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as ImportIcon,
    OpenInNew as OpenInNewIcon,
    AutoAwesome as AIIcon,
    Folder as FolderIcon,
    Check as CheckIcon
} from '@mui/icons-material';
import LibrarySelectionModal from './LibrarySelectionModal';

const PURPLE = '#8b6cbc';
const PURPLE_HOVER = '#7b5ca7';

const summarySx = {
    '& h3': {
        fontSize: '0.95rem',
        fontWeight: 700,
        color: '#334155',
        mt: 2,
        mb: 0.75,
        '&:first-of-type': { mt: 0 }
    },
    '& p': {
        fontSize: '0.875rem',
        lineHeight: 1.7,
        color: '#475569',
        mb: 1.25
    },
    '& ul': {
        ml: 0,
        mb: 1.25,
        pl: 0,
        listStyleType: 'none'
    },
    '& li': {
        fontSize: '0.875rem',
        lineHeight: 1.7,
        color: '#475569',
        mb: 0.75,
        position: 'relative',
        pl: 2,
        '&:before': {
            content: '"•"',
            position: 'absolute',
            left: 0,
            color: PURPLE,
            fontWeight: 700
        }
    },
    '& strong': {
        fontWeight: 600,
        color: '#1e293b'
    }
};

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
    const { t } = useTranslation();
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
            } catch (err) {
                console.error('Error checking for duplicate:', err);
                setIsDuplicate(false);
            } finally {
                setCheckingDuplicate(false);
            }
        };

        checkDuplicate();
    }, [open, publication]);

    useEffect(() => {
        if (open && publication) {
            if (publication.abstract || publication.title) {
                generateAISummary();
            }
        }
    }, [open, publication]);

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
        setLocalFolderAssociations(prev => {
            const folderPubs = prev[folderId] || [];
            if (folderPubs.some(pub => pub.id === publication.id)) {
                return prev;
            }
            return {
                ...prev,
                [folderId]: [...folderPubs, publication]
            };
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
            const folderIds = Object.keys(localFolderAssociations);
            await onImport(publication, selectedLibrary, folderIds);
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

    const typeLabel = publication.type || publication.publicationType || 'article';
    const citationLine = [
        publication.journal,
        publication.volume && `Vol. ${publication.volume}`,
        publication.issue && `Issue ${publication.issue}`,
        publication.pages && `pp. ${publication.pages}`,
    ].filter(Boolean).join(' · ');

    const summaryHtml = (aiSummary || '')
        .replace(/\\n/g, '\n')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    const extraKeywords = (publication.keywords || []).filter(
        (keyword) => !aiKeywords.some((ai) => ai.toLowerCase() === String(keyword).toLowerCase())
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '90vh' }
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                        Publication preview
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                        Review details before adding to your library
                    </Typography>
                </Box>
                <IconButton
                    size="small"
                    onClick={onClose}
                    sx={{
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.16)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ px: 3, py: 3 }}>
                {isDuplicate && (
                    <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
                        This publication is already in your library.
                    </Alert>
                )}

                <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.35, mb: 1, color: '#1e293b' }}>
                    {publication.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
                    {formatAuthors(publication.authors)}
                </Typography>

                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.25 }}>
                    {publication.year && (
                        <Chip
                            label={publication.year.toString()}
                            size="small"
                            sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 600 }}
                        />
                    )}
                    <Chip
                        label={typeLabel}
                        size="small"
                        sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 600, textTransform: 'capitalize' }}
                    />
                    {publication.source && (
                        <Chip
                            label={publication.source}
                            size="small"
                            variant="outlined"
                            sx={{ borderColor: alpha(PURPLE, 0.3), color: PURPLE }}
                        />
                    )}
                </Stack>

                {citationLine && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        {citationLine}
                    </Typography>
                )}

                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
                    {publication.doi && (
                        <Link
                            href={`https://doi.org/${publication.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: PURPLE,
                                fontSize: '0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                        >
                            DOI: {publication.doi}
                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                        </Link>
                    )}
                    {publication.pubmedId && (
                        <Link
                            href={`https://pubmed.ncbi.nlm.nih.gov/${publication.pubmedId}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                color: PURPLE,
                                fontSize: '0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                textDecoration: 'none',
                                '&:hover': { textDecoration: 'underline' }
                            }}
                        >
                            PubMed: {publication.pubmedId}
                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                        </Link>
                    )}
                </Stack>

                {publication.abstract && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.8, color: PURPLE }}>
                            Abstract
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.75 }}>
                            {publication.abstract}
                        </Typography>
                    </Box>
                )}

                <Box
                    sx={{
                        mb: 3,
                        p: 2.25,
                        bgcolor: alpha(PURPLE, 0.06),
                        borderRadius: 2,
                        border: `1px solid ${alpha(PURPLE, 0.16)}`
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
                        <AIIcon sx={{ color: PURPLE, fontSize: 18 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: PURPLE }}>
                            AI summary
                        </Typography>
                    </Box>

                    {generatingAI ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5 }}>
                            <CircularProgress size={16} sx={{ color: PURPLE }} />
                            <Typography variant="body2" color="text.secondary">
                                Generating summary…
                            </Typography>
                        </Box>
                    ) : aiError ? (
                        <Alert
                            severity={aiError.includes('quota') || aiError.includes('exceeded') ? 'info' : 'warning'}
                            sx={{ borderRadius: 1.5 }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25 }}>
                                {aiError.includes('quota') || aiError.includes('exceeded')
                                    ? 'AI summary temporarily unavailable'
                                    : 'Unable to generate AI summary'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {aiError}
                            </Typography>
                        </Alert>
                    ) : aiSummary ? (
                        <Box>
                            <Box sx={summarySx} dangerouslySetInnerHTML={{ __html: summaryHtml }} />
                            {aiKeywords.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 1 }}>
                                        Keywords
                                    </Typography>
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                        {aiKeywords.map((keyword) => (
                                            <Chip
                                                key={keyword}
                                                label={keyword}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    borderColor: alpha(PURPLE, 0.35),
                                                    color: PURPLE,
                                                    bgcolor: 'white'
                                                }}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No abstract available to generate a summary.
                        </Typography>
                    )}
                </Box>

                {(publication.country || (publication.funders && publication.funders.length > 0) || extraKeywords.length > 0) && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 0.8, color: PURPLE, display: 'block', mb: 1.25 }}>
                            Additional details
                        </Typography>
                        <Stack spacing={1.5}>
                            {publication.country && (
                                <Typography variant="body2" color="text.secondary">
                                    <Box component="span" sx={{ fontWeight: 600, color: '#334155' }}>Country: </Box>
                                    {publication.country}
                                </Typography>
                            )}
                            {publication.funders?.length > 0 && (
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                                        Funders
                                    </Typography>
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                        {publication.funders.map((funder) => (
                                            <Chip
                                                key={funder}
                                                label={funder}
                                                size="small"
                                                sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE }}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            )}
                            {extraKeywords.length > 0 && (
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', mb: 0.75 }}>
                                        Source keywords
                                    </Typography>
                                    <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                        {extraKeywords.slice(0, 8).map((keyword) => (
                                            <Chip
                                                key={keyword}
                                                label={keyword}
                                                size="small"
                                                variant="outlined"
                                                sx={{ borderColor: alpha(PURPLE, 0.3), color: PURPLE }}
                                            />
                                        ))}
                                        {extraKeywords.length > 8 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                                +{extraKeywords.length - 8} more
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                )}

                {!isDuplicate && (
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${alpha(PURPLE, 0.18)}`,
                            bgcolor: alpha(PURPLE, 0.04)
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: selectedLibrary ? 1.25 : 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                <FolderIcon sx={{ color: PURPLE, fontSize: 20 }} />
                                <Box>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                        Library folder
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedLibrary
                                            ? `Will be added to ${selectedLibraryName}`
                                            : 'Choose a folder before importing'}
                                    </Typography>
                                </Box>
                            </Box>
                            <Button
                                variant={selectedLibrary ? 'outlined' : 'contained'}
                                size="small"
                                onClick={() => setLibraryModalOpen(true)}
                                sx={{
                                    flexShrink: 0,
                                    ...(selectedLibrary
                                        ? {
                                            borderColor: PURPLE,
                                            color: PURPLE,
                                            '&:hover': {
                                                borderColor: PURPLE_HOVER,
                                                bgcolor: alpha(PURPLE, 0.08)
                                            }
                                        }
                                        : {
                                            bgcolor: PURPLE,
                                            '&:hover': { bgcolor: PURPLE_HOVER }
                                        })
                                }}
                            >
                                {selectedLibrary ? 'Change' : 'Select folder'}
                            </Button>
                        </Box>
                    </Box>
                )}

                {error && (
                    <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8f7fb', borderTop: '1px solid #eee' }}>
                {isDuplicate ? (
                    <Button
                        variant="contained"
                        onClick={onClose}
                        sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_HOVER } }}
                    >
                        Close
                    </Button>
                ) : (
                    <>
                        <Button onClick={onClose} disabled={importing}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleImport}
                            disabled={importing || !selectedLibrary || checkingDuplicate}
                            startIcon={importing || checkingDuplicate ? <CircularProgress size={16} color="inherit" /> : <ImportIcon />}
                            sx={{
                                bgcolor: PURPLE,
                                '&:hover': { bgcolor: PURPLE_HOVER }
                            }}
                        >
                            {checkingDuplicate ? 'Checking…' : importing ? 'Importing…' : 'Import publication'}
                        </Button>
                    </>
                )}
            </DialogActions>

            <LibrarySelectionModal
                open={libraryModalOpen}
                onClose={() => setLibraryModalOpen(false)}
                onSelect={async (folderId) => {
                    handleAddToFolder(folderId);
                    try {
                        const res = await fetch('/api/publications/library');
                        const data = await res.json();
                        if (data.success && data.folders) {
                            const folder = data.folders.find(f => f.id === folderId);
                            if (folder) {
                                handleLibrarySelect(folderId, folder.name);
                            }
                        }
                    } catch (err) {
                        console.error('Error selecting folder:', err);
                        setError('Failed to select folder');
                    }
                }}
                publicationTitle={publication?.title}
                multiplePublications={false}
                publicationCount={1}
                localFolderAssociations={localFolderAssociations}
            />

            <Dialog
                open={successDialogOpen}
                onClose={handleCloseSuccessDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{
                    background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <CheckIcon />
                    Import successful
                </DialogTitle>
                <DialogContent sx={{ mt: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        <strong>{importedPublicationTitle}</strong> has been added to your library.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        What would you like to do next?
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, gap: 1, justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        onClick={handleImportAnother}
                        sx={{
                            borderColor: PURPLE,
                            color: PURPLE,
                            '&:hover': {
                                borderColor: PURPLE_HOVER,
                                bgcolor: alpha(PURPLE, 0.08)
                            }
                        }}
                    >
                        Import another
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleManagePublications}
                        sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_HOVER } }}
                    >
                        Manage publications
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default PublicationPreviewDialog;
