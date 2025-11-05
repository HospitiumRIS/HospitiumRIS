'use client';

import React, { useState } from 'react';
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
    Grid
} from '@mui/material';
import {
    Close as CloseIcon,
    Visibility as PreviewIcon,
    Download as ImportIcon,
    OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

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

    if (!publication) return null;

    const handleImport = async () => {
        try {
            setError(null);
            await onImport(publication);
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
        </Dialog>
    );
};

export default PublicationPreviewDialog;
