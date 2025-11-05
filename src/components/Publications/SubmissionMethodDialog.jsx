'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    Checkbox,
    FormControlLabel,
    Paper,
    Divider,
    IconButton,
    LinearProgress,
    Alert
} from '@mui/material';
import {
    Close as CloseIcon,
    Upload as UploadIcon,
    Preview as PreviewIcon,
    Send as SendIcon
} from '@mui/icons-material';

const SubmissionMethodDialog = ({
    open,
    onClose,
    selectedMethod,
    submissionForm,
    onFormUpdate,
    onPreview,
    onSubmit
}) => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [draftInfo, setDraftInfo] = useState(null);
    const [showDraftBanner, setShowDraftBanner] = useState(false);

    // Check if form has content
    const hasFormContent = useCallback(() => {
        return submissionForm.title?.trim() || 
               submissionForm.authors?.trim() || 
               submissionForm.abstract?.trim() || 
               submissionForm.keywords?.trim() ||
               submissionForm.articleType ||
               submissionForm.subject ||
               submissionForm.manuscript ||
               submissionForm.ethicsStatement?.trim() ||
               submissionForm.fundingStatement?.trim();
    }, [submissionForm]);

    // Save form data to localStorage whenever it changes
    useEffect(() => {
        if (hasFormContent() && selectedMethod) {
            const formData = {
                ...submissionForm,
                manuscript: null, // Don't persist files
                figures: null,
                timestamp: Date.now()
            };
            localStorage.setItem(`submission-draft-${selectedMethod.id}`, JSON.stringify(formData));
        }
    }, [submissionForm, selectedMethod, hasFormContent]);

    // Check for saved draft when dialog opens
    useEffect(() => {
        if (open && selectedMethod) {
            const savedData = localStorage.getItem(`submission-draft-${selectedMethod.id}`);
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    // Only show if it's recent (less than 24 hours)
                    if (parsedData.timestamp && (Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000)) {
                        // Check if draft has meaningful content
                        const hasDraftContent = parsedData.title?.trim() || 
                                              parsedData.authors?.trim() || 
                                              parsedData.abstract?.trim() || 
                                              parsedData.articleType ||
                                              parsedData.subject;
                        
                        if (hasDraftContent) {
                            const timeAgo = Math.round((Date.now() - parsedData.timestamp) / (1000 * 60)); // minutes ago
                            setDraftInfo({
                                data: parsedData,
                                title: parsedData.title || 'Untitled',
                                timeAgo: timeAgo < 60 ? `${timeAgo} minutes ago` : `${Math.round(timeAgo / 60)} hours ago`
                            });
                            
                            // Only show banner if current form is empty
                            if (!hasFormContent()) {
                                setShowDraftBanner(true);
                            }
                        }
                    } else {
                        // Clean up expired drafts
                        localStorage.removeItem(`submission-draft-${selectedMethod.id}`);
                    }
                } catch (e) {
                    console.warn('Failed to parse draft:', e);
                    localStorage.removeItem(`submission-draft-${selectedMethod.id}`);
                }
            }
        }
    }, [open, selectedMethod, hasFormContent]);

    const handleInputChange = useCallback((field, value) => {
        onFormUpdate({ [field]: value });
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    }, [onFormUpdate, errors]);

    const handleClose = useCallback(() => {
        if (hasFormContent()) {
            setShowCloseConfirm(true);
        } else {
            onClose();
        }
    }, [hasFormContent, onClose]);

    const handleConfirmClose = useCallback(() => {
        setShowCloseConfirm(false);
        onClose();
    }, [onClose]);

    const handleCancelClose = useCallback(() => {
        setShowCloseConfirm(false);
    }, []);

    const handleResumeDraft = useCallback(() => {
        if (draftInfo?.data) {
            const draftData = { ...draftInfo.data };
            delete draftData.timestamp;
            onFormUpdate(draftData);
            setShowDraftBanner(false);
        }
    }, [draftInfo, onFormUpdate]);

    const handleStartFresh = useCallback(() => {
        setShowDraftBanner(false);
        // Optionally clear the draft from localStorage
        if (selectedMethod) {
            localStorage.removeItem(`submission-draft-${selectedMethod.id}`);
        }
    }, [selectedMethod]);

    const handleFileChange = useCallback((field, event) => {
        const file = event.target.files[0];
        handleInputChange(field, file);
    }, [handleInputChange]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!submissionForm.title.trim()) {
            newErrors.title = 'Title is required';
        }
        
        if (!submissionForm.authors.trim()) {
            newErrors.authors = 'Authors are required';
        }
        
        if (!submissionForm.abstract.trim()) {
            newErrors.abstract = 'Abstract is required';
        }
        
        if (!submissionForm.articleType) {
            newErrors.articleType = 'Article type is required';
        }
        
        if (!submissionForm.manuscript) {
            newErrors.manuscript = 'Manuscript file is required';
        }
        
        if (!submissionForm.agreesToTerms) {
            newErrors.agreesToTerms = 'You must agree to the terms and conditions';
        }

        // medRxiv specific validations
        if (selectedMethod?.id === 'medrxiv') {
            if (!submissionForm.ethicsStatement.trim()) {
                newErrors.ethicsStatement = 'Ethics statement is required for medRxiv';
            }
            
            if (!submissionForm.fundingStatement.trim()) {
                newErrors.fundingStatement = 'Funding statement is required for medRxiv';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await onSubmit(submissionForm);
            // Clear the draft after successful submission
            if (selectedMethod) {
                localStorage.removeItem(`submission-draft-${selectedMethod.id}`);
            }
        } catch (error) {
            console.error('Submission error:', error);
        } finally {
            setLoading(false);
        }
    };

    const articleTypes = [
        'Research Article',
        'Review Article',
        'Short Communication',
        'Case Study',
        'Opinion',
        'Editorial',
        'Letter to the Editor'
    ];

    const subjects = selectedMethod?.id === 'medrxiv' ? [
        'Allergy and Immunology',
        'Anesthesia',
        'Cardiovascular Medicine',
        'Dermatology',
        'Emergency Medicine',
        'Endocrinology',
        'Gastroenterology',
        'Genetic and Genomic Medicine',
        'Geriatric Medicine',
        'Health Economics',
        'Health Informatics',
        'Health Policy',
        'Hematology',
        'Infectious Diseases',
        'Intensive Care and Critical Care Medicine',
        'Medical Education',
        'Medical Ethics',
        'Nephrology',
        'Neurology',
        'Nursing',
        'Nutrition',
        'Obstetrics and Gynecology',
        'Occupational and Environmental Health',
        'Oncology',
        'Ophthalmology',
        'Orthopedics',
        'Otolaryngology',
        'Palliative Medicine',
        'Pathology',
        'Pediatrics',
        'Pharmacology and Therapeutics',
        'Primary Care Research',
        'Psychiatry and Clinical Psychology',
        'Public and Global Health',
        'Radiology and Imaging',
        'Rehabilitation Medicine and Physical Therapy',
        'Respiratory Medicine',
        'Rheumatology',
        'Sexual and Reproductive Health',
        'Sports Medicine',
        'Surgery',
        'Urology'
    ] : [
        'Animal Behavior and Cognition',
        'Biochemistry',
        'Bioengineering',
        'Bioinformatics',
        'Biophysics',
        'Cancer Biology',
        'Cell Biology',
        'Developmental Biology',
        'Ecology',
        'Evolutionary Biology',
        'Genetics',
        'Genomics',
        'Immunology',
        'Microbiology',
        'Molecular Biology',
        'Neuroscience',
        'Paleontology',
        'Pathology',
        'Pharmacology and Toxicology',
        'Physiology',
        'Plant Biology',
        'Structural Biology',
        'Synthetic Biology',
        'Systems Biology',
        'Zoology'
    ];

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown
            PaperProps={{
                sx: { 
                    borderRadius: 3,
                    overflow: 'hidden'
                }
            }}
        >
            {loading && <LinearProgress sx={{ color: '#8b6cbc' }} />}
            
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
                            Submit to {selectedMethod?.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                            Complete the form below to submit your preprint
                        </Typography>
                    </Box>
                </Box>
                <IconButton 
                    onClick={handleClose} 
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
                {/* Draft Resume Banner */}
                {showDraftBanner && draftInfo && (
                    <Alert 
                        severity="info"
                        sx={{ 
                            mb: 3,
                            bgcolor: '#8b6cbc10',
                            border: '1px solid #8b6cbc40',
                            '& .MuiAlert-icon': {
                                color: '#8b6cbc'
                            }
                        }}
                        action={
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                    size="small" 
                                    onClick={handleResumeDraft}
                                    sx={{
                                        bgcolor: '#8b6cbc',
                                        color: 'white',
                                        '&:hover': {
                                            bgcolor: '#7559a3'
                                        }
                                    }}
                                >
                                    Resume Draft
                                </Button>
                                <Button 
                                    size="small" 
                                    onClick={handleStartFresh}
                                    sx={{ color: 'text.secondary' }}
                                >
                                    Start Fresh
                                </Button>
                            </Box>
                        }
                    >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Draft Available
                        </Typography>
                        <Typography variant="body2">
                            "{draftInfo.title}" was saved {draftInfo.timeAgo}. Would you like to resume where you left off?
                        </Typography>
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid size={12}>
                        <TextField
                            fullWidth
                            label="Manuscript Title *"
                            value={submissionForm.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            error={!!errors.title}
                            helperText={errors.title}
                            multiline
                            rows={2}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'white',
                                    '& fieldset': {
                                        borderColor: '#e0e0e0'
                                    }
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={12}>
                        <TextField
                            fullWidth
                            label="Authors *"
                            placeholder="Enter authors in the format: FirstName LastName, FirstName LastName"
                            value={submissionForm.authors}
                            onChange={(e) => handleInputChange('authors', e.target.value)}
                            error={!!errors.authors}
                            helperText={errors.authors || "Enter authors in the format: FirstName LastName, FirstName LastName"}
                            multiline
                            rows={2}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'white',
                                    '& fieldset': {
                                        borderColor: '#e0e0e0'
                                    }
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={12}>
                        <TextField
                            fullWidth
                            label="Abstract *"
                            value={submissionForm.abstract}
                            onChange={(e) => handleInputChange('abstract', e.target.value)}
                            error={!!errors.abstract}
                            helperText={errors.abstract}
                            multiline
                            rows={6}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'white',
                                    '& fieldset': {
                                        borderColor: '#e0e0e0'
                                    }
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={6}>
                        <FormControl 
                            fullWidth 
                            error={!!errors.articleType}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'white',
                                    '& fieldset': {
                                        borderColor: '#e0e0e0'
                                    }
                                }
                            }}
                        >
                            <InputLabel>Article Type *</InputLabel>
                            <Select
                                value={submissionForm.articleType}
                                onChange={(e) => handleInputChange('articleType', e.target.value)}
                                label="Article Type *"
                            >
                                {articleTypes.map((type) => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </Select>
                            {errors.articleType && <FormHelperText>{errors.articleType}</FormHelperText>}
                        </FormControl>
                    </Grid>

                    <Grid size={6}>
                        <FormControl 
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'white',
                                    '& fieldset': {
                                        borderColor: '#e0e0e0'
                                    }
                                }
                            }}
                        >
                            <InputLabel>Subject Area *</InputLabel>
                            <Select
                                value={submissionForm.subject}
                                onChange={(e) => handleInputChange('subject', e.target.value)}
                                label="Subject Area *"
                            >
                                {subjects.map((subject) => (
                                    <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={12}>
                        <TextField
                            fullWidth
                            label="Keywords"
                            placeholder="Enter keywords separated by commas"
                            value={submissionForm.keywords}
                            onChange={(e) => handleInputChange('keywords', e.target.value)}
                            helperText="Enter keywords separated by commas"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'white',
                                    '& fieldset': {
                                        borderColor: '#e0e0e0'
                                    }
                                }
                            }}
                        />
                    </Grid>

                    <Grid size={12}>
                        <FormControl 
                            fullWidth
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'white',
                                    '& fieldset': {
                                        borderColor: '#e0e0e0'
                                    }
                                }
                            }}
                        >
                            <InputLabel>License</InputLabel>
                            <Select
                                value={submissionForm.license}
                                onChange={(e) => handleInputChange('license', e.target.value)}
                                label="License"
                            >
                                <MenuItem value="CC-BY">CC BY 4.0 (Attribution)</MenuItem>
                                <MenuItem value="CC-BY-SA">CC BY-SA 4.0 (Attribution-ShareAlike)</MenuItem>
                                <MenuItem value="CC-BY-NC">CC BY-NC 4.0 (Attribution-NonCommercial)</MenuItem>
                                <MenuItem value="CC-BY-NC-SA">CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike)</MenuItem>
                                <MenuItem value="CC-BY-ND">CC BY-ND 4.0 (Attribution-NoDerivs)</MenuItem>
                                <MenuItem value="CC-BY-NC-ND">CC BY-NC-ND 4.0 (Attribution-NonCommercial-NoDerivs)</MenuItem>
                                <MenuItem value="CC0">CC0 (Public Domain Dedication)</MenuItem>
                            </Select>
                            <FormHelperText>
                                Choose the license under which your work will be made available. 
                                CC BY 4.0 is recommended for maximum accessibility.
                            </FormHelperText>
                        </FormControl>
                    </Grid>

                    <Grid size={12}>
                        <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 600, mt: 3 }}>
                            Required Files
                        </Typography>
                    </Grid>

                    {/* File uploads */}
                    <Grid size={12}>
                        <Paper sx={{ 
                            p: 3, 
                            border: '2px dashed #8b6cbc', 
                            textAlign: 'center',
                            bgcolor: 'white',
                            borderRadius: 2
                        }}>
                            <input
                                type="file"
                                id="manuscript-upload"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => handleFileChange('manuscript', e)}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="manuscript-upload">
                                <Button
                                    variant="contained"
                                    component="span"
                                    startIcon={<UploadIcon />}
                                    sx={{ 
                                        mb: 2,
                                        bgcolor: '#8b6cbc',
                                        '&:hover': {
                                            bgcolor: '#7559a3'
                                        }
                                    }}
                                >
                                    Upload Manuscript (PDF/DOC)
                                </Button>
                            </label>
                            {submissionForm.manuscript && (
                                <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                                    ✓ {submissionForm.manuscript.name}
                                </Typography>
                            )}
                            {errors.manuscript && (
                                <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                                    {errors.manuscript}
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    <Grid size={12}>
                        <Paper sx={{ 
                            p: 3, 
                            border: '2px dashed #ddd', 
                            textAlign: 'center',
                            bgcolor: 'white',
                            borderRadius: 2
                        }}>
                            <input
                                type="file"
                                id="figures-upload"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileChange('figures', e)}
                                style={{ display: 'none' }}
                                multiple
                            />
                            <label htmlFor="figures-upload">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<UploadIcon />}
                                    sx={{ 
                                        mb: 2,
                                        borderColor: '#8b6cbc',
                                        color: '#8b6cbc',
                                        '&:hover': {
                                            borderColor: '#7559a3',
                                            bgcolor: 'rgba(139, 108, 188, 0.04)'
                                        }
                                    }}
                                >
                                    Upload Figures (Optional)
                                </Button>
                            </label>
                            {submissionForm.figures && (
                                <Typography variant="body2" color="success.main" sx={{ mb: 1 }}>
                                    ✓ {submissionForm.figures.length} file(s) selected
                                </Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* medRxiv specific fields */}
                    {selectedMethod?.id === 'medrxiv' && (
                        <>
                            <Grid size={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 500 }}>
                                    medRxiv Requirements
                                </Typography>
                            </Grid>

                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    label="Ethics Statement"
                                    value={submissionForm.ethicsStatement}
                                    onChange={(e) => handleInputChange('ethicsStatement', e.target.value)}
                                    error={!!errors.ethicsStatement}
                                    helperText={errors.ethicsStatement || "Required for medRxiv submissions"}
                                    multiline
                                    rows={3}
                                />
                            </Grid>

                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    label="Funding Statement"
                                    value={submissionForm.fundingStatement}
                                    onChange={(e) => handleInputChange('fundingStatement', e.target.value)}
                                    error={!!errors.fundingStatement}
                                    helperText={errors.fundingStatement || "Required for medRxiv submissions"}
                                    multiline
                                    rows={2}
                                />
                            </Grid>

                            <Grid size={6}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={submissionForm.patientConsent}
                                            onChange={(e) => handleInputChange('patientConsent', e.target.checked)}
                                        />
                                    }
                                    label="Patient consent obtained"
                                />
                            </Grid>

                            <Grid size={6}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={submissionForm.irb}
                                            onChange={(e) => handleInputChange('irb', e.target.checked)}
                                        />
                                    }
                                    label="IRB/Ethics approval obtained"
                                />
                            </Grid>
                        </>
                    )}

                    {/* Terms and conditions */}
                    <Grid size={12}>
                        <Divider sx={{ my: 2 }} />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={submissionForm.agreesToTerms}
                                    onChange={(e) => handleInputChange('agreesToTerms', e.target.checked)}
                                />
                            }
                            label={`I agree to the ${selectedMethod?.name} terms and conditions`}
                        />
                        {errors.agreesToTerms && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                                {errors.agreesToTerms}
                            </Alert>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, justifyContent: 'space-between', bgcolor: '#f5f5f5' }}>
                <Button 
                    onClick={handleClose} 
                    disabled={loading}
                    sx={{ color: 'text.secondary' }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={onPreview}
                    variant="contained"
                    startIcon={<PreviewIcon />}
                    disabled={loading}
                    sx={{
                        bgcolor: '#8b6cbc',
                        '&:hover': {
                            bgcolor: '#7559a3'
                        }
                    }}
                >
                    Preview Submission
                </Button>
            </DialogActions>

            {/* Close Confirmation Dialog */}
            <Dialog
                open={showCloseConfirm}
                onClose={handleCancelClose}
                maxWidth="sm"
                PaperProps={{
                    sx: { borderRadius: 3 }
                }}
            >
                <DialogTitle>
                    Unsaved Changes
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body1">
                        You have unsaved changes in your submission form. Are you sure you want to close without saving?
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                        Your draft will be automatically saved and available when you return.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleCancelClose} sx={{ color: 'text.secondary' }}>
                        Continue Editing
                    </Button>
                    <Button 
                        onClick={handleConfirmClose} 
                        variant="contained" 
                        color="error"
                    >
                        Close Anyway
                    </Button>
                </DialogActions>
            </Dialog>
        </Dialog>
    );
};

export default SubmissionMethodDialog;
