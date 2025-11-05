'use client';

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Grid,
    Paper,
    Divider,
    IconButton,
    Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    Description as DescriptionIcon,
    Person as PersonIcon,
    Category as CategoryIcon,
    Subject as SubjectIcon
} from '@mui/icons-material';

const PreviewDialog = ({
    open,
    onClose,
    submissionForm,
    selectedMethod,
    onSubmit
}) => {
    const formatAuthors = (authorsString) => {
        if (!authorsString) return [];
        return authorsString.split(',').map(author => author.trim()).filter(author => author);
    };

    const formatKeywords = (keywordsString) => {
        if (!keywordsString) return [];
        return keywordsString.split(',').map(keyword => keyword.trim()).filter(keyword => keyword);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { 
                    borderRadius: 3, 
                    maxHeight: '90vh',
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{ 
                bgcolor: '#8b6cbc',
                color: 'white',
                p: 3,
                position: 'relative'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img
                        src={selectedMethod?.logo}
                        alt={selectedMethod?.name}
                        style={{ 
                            height: 40, 
                            objectFit: 'contain',
                            filter: 'brightness(0) invert(1)' // Makes logo white
                        }}
                    />
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: 'white' }}>
                            Submission Preview - {selectedMethod?.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                            Review your submission before final submission
                        </Typography>
                    </Box>
                </Box>
                <IconButton 
                    onClick={onClose} 
                    size="small"
                    sx={{ 
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        color: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.2)'
                        }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 4, bgcolor: '#fafafa' }}>
                <Grid container spacing={3}>
                    {/* Title */}
                    <Grid size={12}>
                        <Paper sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                MANUSCRIPT TITLE
                            </Typography>
                            <Typography variant="h6" sx={{ mt: 1, fontWeight: 500, lineHeight: 1.4 }}>
                                {submissionForm.title || 'No title provided'}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Authors */}
                    <Grid size={12}>
                        <Paper sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <PersonIcon sx={{ color: '#8b6cbc', mt: 0.5, fontSize: 24 }} />
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                        AUTHORS
                                    </Typography>
                                    <Box sx={{ mt: 1 }}>
                                        {formatAuthors(submissionForm.authors).length > 0 ? (
                                            formatAuthors(submissionForm.authors).map((author, index) => (
                                                <Chip
                                                    key={index}
                                                    label={author}
                                                    size="small"
                                                    sx={{ 
                                                        mr: 1, 
                                                        mb: 1,
                                                        bgcolor: '#8b6cbc',
                                                        color: 'white',
                                                        fontWeight: 500
                                                    }}
                                                />
                                            ))
                                        ) : (
                                            <Typography color="text.secondary" variant="body2">
                                                No authors provided
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Article Type and Subject */}
                    <Grid size={6}>
                        <Paper sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0', height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <CategoryIcon sx={{ color: '#8b6cbc', mt: 0.5, fontSize: 24 }} />
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                        ARTICLE TYPE
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                                        {submissionForm.articleType || 'Not specified'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={6}>
                        <Paper sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0', height: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <SubjectIcon sx={{ color: '#8b6cbc', mt: 0.5, fontSize: 24 }} />
                                <Box>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                        SUBJECT AREA
                                    </Typography>
                                    <Typography variant="body1" sx={{ mt: 1, fontWeight: 500 }}>
                                        {submissionForm.subject || 'Not specified'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Abstract */}
                    <Grid size={12}>
                        <Paper sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                ABSTRACT
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
                                {submissionForm.abstract || 'No abstract provided'}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* Keywords */}
                    {submissionForm.keywords && (
                        <Grid size={12}>
                            <Paper sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                    KEYWORDS
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                    {formatKeywords(submissionForm.keywords).map((keyword, index) => (
                                        <Chip
                                            key={index}
                                            label={keyword}
                                            size="small"
                                            sx={{ 
                                                mr: 1, 
                                                mb: 1,
                                                bgcolor: '#8b6cbc15',
                                                color: '#8b6cbc',
                                                border: '1px solid #8b6cbc40',
                                                fontWeight: 500
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    )}

                    {/* License */}
                    <Grid size={12}>
                        <Paper sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                LICENSE
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip
                                    label={submissionForm.license || 'CC-BY'}
                                    size="medium"
                                    sx={{ 
                                        bgcolor: '#8b6cbc',
                                        color: 'white',
                                        fontWeight: 600
                                    }}
                                />
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {submissionForm.license === 'CC-BY' && 'Recommended for maximum accessibility'}
                                    {submissionForm.license === 'CC-BY-SA' && 'Requires derivative works to use same license'}
                                    {submissionForm.license === 'CC-BY-NC' && 'Non-commercial use only'}
                                    {submissionForm.license === 'CC-BY-NC-SA' && 'Non-commercial, derivative works same license'}
                                    {submissionForm.license === 'CC-BY-ND' && 'No derivative works allowed'}
                                    {submissionForm.license === 'CC-BY-NC-ND' && 'Non-commercial, no derivatives'}
                                    {submissionForm.license === 'CC0' && 'Public domain - no rights reserved'}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Files */}
                    <Grid size={12}>
                        <Paper sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                UPLOADED FILES
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                {submissionForm.manuscript ? (
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 2, 
                                        p: 2, 
                                        bgcolor: '#e8f5e8', 
                                        borderRadius: 1,
                                        border: '1px solid #4caf5040'
                                    }}>
                                        <DescriptionIcon sx={{ color: '#4caf50', fontSize: 24 }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                Manuscript: {submissionForm.manuscript.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Required file uploaded
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 2, 
                                        p: 2, 
                                        bgcolor: '#fff3cd', 
                                        borderRadius: 1,
                                        border: '1px solid #ffc10740'
                                    }}>
                                        <DescriptionIcon sx={{ color: '#ff9800', fontSize: 24 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            No manuscript file uploaded
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* medRxiv specific fields */}
                    {selectedMethod?.id === 'medrxiv' && (
                        <>
                            <Grid size={12}>
                                <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1, color: 'text.primary', fontWeight: 600 }}>
                                    medRxiv Requirements
                                </Typography>
                            </Grid>

                            {submissionForm.ethicsStatement && (
                                <Grid size={12}>
                                    <Paper sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                            ETHICS STATEMENT
                                        </Typography>
                                        <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
                                            {submissionForm.ethicsStatement}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            )}

                            {submissionForm.fundingStatement && (
                                <Grid size={12}>
                                    <Paper sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                        <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                            FUNDING STATEMENT
                                        </Typography>
                                        <Typography variant="body1" sx={{ mt: 1, lineHeight: 1.6 }}>
                                            {submissionForm.fundingStatement}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            )}

                            <Grid size={12}>
                                <Paper sx={{ p: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                                    <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 2, display: 'block' }}>
                                        COMPLIANCE CHECKLIST
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <Chip
                                            label={`Patient Consent: ${submissionForm.patientConsent ? 'Yes' : 'No'}`}
                                            sx={{ 
                                                bgcolor: submissionForm.patientConsent ? '#e8f5e8' : '#fff3cd',
                                                color: submissionForm.patientConsent ? '#4caf50' : '#ff9800',
                                                fontWeight: 500
                                            }}
                                        />
                                        <Chip
                                            label={`IRB Approval: ${submissionForm.irb ? 'Yes' : 'No'}`}
                                            sx={{ 
                                                bgcolor: submissionForm.irb ? '#e8f5e8' : '#fff3cd',
                                                color: submissionForm.irb ? '#4caf50' : '#ff9800',
                                                fontWeight: 500
                                            }}
                                        />
                                    </Box>
                                </Paper>
                            </Grid>
                        </>
                    )}

                    {/* Terms agreement */}
                    <Grid size={12}>
                        <Paper sx={{ 
                            p: 3, 
                            bgcolor: submissionForm.agreesToTerms ? '#e8f5e8' : '#fff3cd', 
                            borderRadius: 2,
                            border: submissionForm.agreesToTerms ? '1px solid #4caf5040' : '1px solid #ffc10740'
                        }}>
                            <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                TERMS & CONDITIONS
                            </Typography>
                            <Typography variant="body1" sx={{ 
                                mt: 1,
                                color: submissionForm.agreesToTerms ? '#4caf50' : '#ff9800',
                                fontWeight: 500
                            }}>
                                {submissionForm.agreesToTerms ? '✓ Agreed to terms and conditions' : '⚠ Terms not yet agreed'}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, justifyContent: 'space-between', bgcolor: '#f5f5f5' }}>
                <Button 
                    onClick={onClose} 
                    variant="outlined"
                    sx={{ color: 'text.secondary' }}
                >
                    Back to Form
                </Button>
                <Button
                    variant="contained"
                    sx={{
                        bgcolor: '#8b6cbc',
                        '&:hover': {
                            bgcolor: '#7559a3'
                        }
                    }}
                    onClick={() => {
                        if (onSubmit) {
                            onSubmit(submissionForm);
                            // Clear the draft after successful submission
                            if (selectedMethod) {
                                localStorage.removeItem(`submission-draft-${selectedMethod.id}`);
                            }
                        }
                        onClose();
                    }}
                >
                    Submit to {selectedMethod?.name}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PreviewDialog;
