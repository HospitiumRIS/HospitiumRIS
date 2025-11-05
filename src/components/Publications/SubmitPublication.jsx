'use client';

import React, { useState, useCallback, useMemo, Suspense, useEffect } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    Badge,
    Chip,
    Button
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import PageHeader from '../common/PageHeader';
import PublishIcon from '@mui/icons-material/Publish';

// Dynamic imports for code splitting and performance optimization
const SubmissionMethodDialog = dynamic(() => import('./SubmissionMethodDialog'), {
    loading: () => <DialogSkeleton />,
    ssr: false
});

const PreviewDialog = dynamic(() => import('./PreviewDialog'), {
    loading: () => <DialogSkeleton />,
    ssr: false
});

// Loading skeleton for dialogs
const DialogSkeleton = () => (
    <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ color: '#8b6cbc' }} />
        <Typography sx={{ mt: 2 }}>Loading...</Typography>
    </Box>
);

// Memoized submission method cards
const SubmissionMethodCard = React.memo(({ method, onSelect, hasDraft, draftInfo }) => (
    <Card 
        sx={{ 
            height: '300px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            border: '2px solid transparent',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 40px ${method.color}30`,
            },
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '12px'
        }}
    >
        {/* Draft indicator */}
        {hasDraft && (
            <Chip
                label="Draft Available"
                size="small"
                sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 2,
                    bgcolor: '#8b6cbc',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.7rem'
                }}
            />
        )}

        <CardActionArea 
            onClick={() => onSelect(method)}
            sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}
        >
            {/* Background gradient */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '40%',
                    background: `linear-gradient(135deg, ${method.color}15, ${method.color}05)`,
                    borderRadius: '12px 12px 0 0'
                }}
            />

            <CardContent sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
                p: 4
            }}>
                {/* Server logo */}
                <Box
                    sx={{
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 80,
                        width: '100%'
                    }}
                >
                    <img
                        src={method.logo}
                        alt={`${method.name} logo`}
                        style={{
                            maxHeight: '100%',
                            maxWidth: '100%',
                            objectFit: 'contain'
                        }}
                        loading="lazy"
                    />
                </Box>

                {/* Server name */}
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 'bold',
                        mb: 1,
                        color: method.color
                    }}
                >
                    {method.name}
                </Typography>

                {/* Server tagline */}
                <Typography
                    variant="caption"
                    sx={{
                        color: 'text.secondary',
                        mb: 2,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        letterSpacing: 1
                    }}
                >
                    {method.tagline}
                </Typography>

                {/* Server description */}
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 'auto' }}
                >
                    {method.description}
                </Typography>

                {/* Draft info */}
                {hasDraft && draftInfo && (
                    <Box sx={{ 
                        mt: 2, 
                        p: 2, 
                        bgcolor: 'rgba(139, 108, 188, 0.1)', 
                        borderRadius: 1,
                        border: '1px solid rgba(139, 108, 188, 0.3)'
                    }}>
                        <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 600, display: 'block' }}>
                            DRAFT SAVED
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.primary', fontWeight: 500 }}>
                            "{draftInfo.title}"
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Last saved {Math.round((Date.now() - draftInfo.lastSaved.getTime()) / (1000 * 60))} min ago
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </CardActionArea>
    </Card>
));

SubmissionMethodCard.displayName = 'SubmissionMethodCard';

// Memoized completion step
const CompletionStep = React.memo(({ selectedMethod, onSubmitAnother, onViewPublications }) => (
    <Paper 
        sx={{ 
            p: 4, 
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#f8f9fa'
        }}
    >
        <Box sx={{ mb: 3 }}>
            <CheckCircleIcon 
                sx={{ 
                    fontSize: 60, 
                    color: '#4caf50',
                    mb: 2
                }} 
            />
            <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                    color: '#2e7d32',
                    fontWeight: 500
                }}
            >
                Preprint Submitted Successfully!
            </Typography>
            <Typography 
                variant="body1" 
                sx={{ 
                    mb: 3,
                    color: '#555'
                }}
            >
                Your manuscript has been submitted to {selectedMethod?.name} and is now pending review.
            </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Box
                component="button"
                onClick={onSubmitAnother}
                sx={{ 
                    backgroundColor: '#8b6cbc',
                    color: 'white',
                    border: 'none',
                    borderRadius: 1,
                    px: 3,
                    py: 1.5,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    '&:hover': {
                        backgroundColor: '#7559a3'
                    }
                }}
            >
                Submit Another Preprint
            </Box>
            <Box
                component="button"
                onClick={onViewPublications}
                sx={{ 
                    backgroundColor: 'transparent',
                    color: '#8b6cbc',
                    border: '1px solid #8b6cbc',
                    borderRadius: 1,
                    px: 3,
                    py: 1.5,
                    cursor: 'pointer',
                    fontSize: '1rem',
                    '&:hover': {
                        backgroundColor: 'rgba(139, 108, 188, 0.04)'
                    }
                }}
            >
                View All Publications
            </Box>
        </Box>
    </Paper>
));

CompletionStep.displayName = 'CompletionStep';

const SubmitPublication = ({ onSubmit }) => {
    const router = useRouter();
    
    // Core state management
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [serverDrafts, setServerDrafts] = useState({});
    
    // Dialog states
    const [methodDialogOpen, setMethodDialogOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    
    // Form state - memoized initial state
    const initialFormState = useMemo(() => ({
        title: '',
        authors: '',
        abstract: '',
        articleType: '',
        subject: '',
        keywords: '',
        manuscript: null,
        figures: null,
        supplementaryFiles: null,
        coverLetter: null,
        hasCompetingInterest: false,
        competingInterestStatement: '',
        correspondingAuthors: [],
        license: 'CC-BY',
        agreesToTerms: false,
        // medRxiv specific fields
        clinicalTrialRegistry: '',
        clinicalTrialNumber: '',
        ethicsStatement: '',
        fundingStatement: '',
        patientConsent: false,
        irb: false
    }), []);

    const [submissionForm, setSubmissionForm] = useState(initialFormState);

    // Memoized submission methods
    const submissionMethods = useMemo(() => [
        {
            id: 'biorxiv',
            name: 'bioRxiv',
            tagline: 'THE PREPRINT SERVER FOR BIOLOGY',
            description: 'Submit preprint to bioRxiv',
            logo: '/biorvix.png',
            color: '#4caf50'
        },
        {
            id: 'medrxiv',
            name: 'medRxiv',
            tagline: 'THE PREPRINT SERVER FOR HEALTH SCIENCES',
            description: 'Submit preprint to medRxiv',
            logo: '/medrvix.png',
            color: '#2196f3'
        }
    ], []);

    // Check for existing drafts on component mount
    useEffect(() => {
        const checkDrafts = () => {
            const drafts = {};
            submissionMethods.forEach(method => {
                const savedData = localStorage.getItem(`submission-draft-${method.id}`);
                if (savedData) {
                    try {
                        const parsedData = JSON.parse(savedData);
                        // Check if draft is recent (less than 24 hours)
                        if (parsedData.timestamp && (Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000)) {
                            // Check if draft has meaningful content
                            const hasContent = parsedData.title?.trim() || 
                                             parsedData.authors?.trim() || 
                                             parsedData.abstract?.trim() || 
                                             parsedData.articleType ||
                                             parsedData.subject;
                            if (hasContent) {
                                drafts[method.id] = {
                                    lastSaved: new Date(parsedData.timestamp),
                                    title: parsedData.title || 'Untitled',
                                    hasContent: true
                                };
                            }
                        } else {
                            // Clean up expired drafts
                            localStorage.removeItem(`submission-draft-${method.id}`);
                        }
                    } catch (e) {
                        console.warn('Failed to parse draft:', e);
                        localStorage.removeItem(`submission-draft-${method.id}`);
                    }
                }
            });
            setServerDrafts(drafts);
        };

        checkDrafts();
    }, [submissionMethods]);

    // Event handlers
    const handleMethodSelect = useCallback((method) => {
        setSelectedMethod(method);
        setActiveStep(1);
        // Don't immediately open modal, let user see step 2 first
    }, []);

    const handleCloseMethodDialog = useCallback(() => {
        setMethodDialogOpen(false);
        setActiveStep(1); // Go back to the draft selection step
    }, []);

    const handleFormUpdate = useCallback((updates) => {
        setSubmissionForm(prev => ({ ...prev, ...updates }));
    }, []);

    const handleSubmitAnother = useCallback(() => {
        setActiveStep(0);
        setSelectedMethod(null);
        setSubmissionForm(initialFormState);
        setMethodDialogOpen(false);
        setPreviewOpen(false);
        // Refresh draft info
        const drafts = {};
        submissionMethods.forEach(method => {
            const savedData = localStorage.getItem(`submission-draft-${method.id}`);
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData.timestamp && (Date.now() - parsedData.timestamp < 24 * 60 * 60 * 1000)) {
                        const hasContent = parsedData.title?.trim() || 
                                         parsedData.authors?.trim() || 
                                         parsedData.abstract?.trim() || 
                                         parsedData.articleType ||
                                         parsedData.subject;
                        if (hasContent) {
                            drafts[method.id] = {
                                lastSaved: new Date(parsedData.timestamp),
                                title: parsedData.title || 'Untitled',
                                hasContent: true
                            };
                        }
                    }
                } catch (e) {
                    localStorage.removeItem(`submission-draft-${method.id}`);
                }
            }
        });
        setServerDrafts(drafts);
    }, [initialFormState, submissionMethods]);

    const handleViewPublications = useCallback(() => {
        router.push('/researcher/publications');
    }, [router]);

    const handlePreview = useCallback(() => {
        setPreviewOpen(true);
    }, []);

    const handleClosePreview = useCallback(() => {
        setPreviewOpen(false);
    }, []);

    const handleSubmitPublication = useCallback(async (formData) => {
        try {
            if (onSubmit) {
                await onSubmit(formData, selectedMethod);
            }
            
            setMethodDialogOpen(false);
            setActiveStep(3);
        } catch (error) {
            console.error('Submission error:', error);
        }
    }, [onSubmit, selectedMethod]);

    const handleStartSubmission = useCallback(() => {
        setActiveStep(2);
        setMethodDialogOpen(true);
    }, []);

    const handleResumeDraftFromStep = useCallback(() => {
        setActiveStep(2);
        if (selectedMethod && serverDrafts[selectedMethod.id]) {
            const savedData = localStorage.getItem(`submission-draft-${selectedMethod.id}`);
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    delete parsedData.timestamp;
                    setSubmissionForm(parsedData);
                    setMethodDialogOpen(true);
                } catch (e) {
                    console.warn('Failed to load draft:', e);
                    setMethodDialogOpen(true);
                }
            }
        } else {
            setMethodDialogOpen(true);
        }
    }, [selectedMethod, serverDrafts, setSubmissionForm]);

    const handleBackToServerSelection = useCallback(() => {
        setActiveStep(0);
        setSelectedMethod(null);
    }, []);

    // Memoized step components
    const stepComponents = useMemo(() => ({
        0: (
            <Grid container spacing={4} justifyContent="center">
                {submissionMethods.map((method) => (
                    <Grid key={method.id} size={{ xs: 12, sm: 6, md: 6 }}>
                        <SubmissionMethodCard 
                            method={method} 
                            onSelect={handleMethodSelect}
                            hasDraft={!!serverDrafts[method.id]}
                            draftInfo={serverDrafts[method.id]}
                        />
                    </Grid>
                ))}
            </Grid>
        ),
        1: selectedMethod && (
            <Container maxWidth="md">
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    {/* Selected Server Display */}
                    <Box sx={{ mb: 4 }}>
                        <img
                            src={selectedMethod.logo}
                            alt={selectedMethod.name}
                            style={{ height: 60, objectFit: 'contain', marginBottom: 16 }}
                        />
                        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, color: selectedMethod.color }}>
                            {selectedMethod.name}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {selectedMethod.tagline}
                        </Typography>
                    </Box>

                    {/* Draft Status and Actions */}
                    {serverDrafts[selectedMethod.id] ? (
                        <Box sx={{ mb: 4 }}>
                            <Paper sx={{ 
                                p: 3, 
                                bgcolor: '#8b6cbc10', 
                                border: '2px solid #8b6cbc40',
                                borderRadius: 2,
                                mb: 3
                            }}>
                                <Typography variant="h6" sx={{ color: '#8b6cbc', fontWeight: 600, mb: 1 }}>
                                    Draft Available
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                                    "{serverDrafts[selectedMethod.id].title}"
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Last saved {Math.round((Date.now() - serverDrafts[selectedMethod.id].lastSaved.getTime()) / (1000 * 60))} minutes ago
                                </Typography>
                            </Paper>

                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleResumeDraftFromStep}
                                    sx={{
                                        bgcolor: '#8b6cbc',
                                        px: 4,
                                        py: 1.5,
                                        '&:hover': {
                                            bgcolor: '#7559a3'
                                        }
                                    }}
                                >
                                    Resume Draft
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="large"
                                    onClick={handleStartSubmission}
                                    sx={{
                                        borderColor: '#8b6cbc',
                                        color: '#8b6cbc',
                                        px: 4,
                                        py: 1.5,
                                        '&:hover': {
                                            borderColor: '#7559a3',
                                            bgcolor: 'rgba(139, 108, 188, 0.04)'
                                        }
                                    }}
                                >
                                    Start Fresh
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                                Ready to submit your manuscript to {selectedMethod.name}
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleStartSubmission}
                                sx={{
                                    bgcolor: '#8b6cbc',
                                    px: 6,
                                    py: 1.5,
                                    '&:hover': {
                                        bgcolor: '#7559a3'
                                    }
                                }}
                            >
                                Start Submission
                            </Button>
                        </Box>
                    )}

                    {/* Back Button */}
                    <Button
                        onClick={handleBackToServerSelection}
                        sx={{ color: 'text.secondary', mt: 2 }}
                    >
                        ← Back to Server Selection
                    </Button>
                </Paper>
            </Container>
        ),
        2: selectedMethod && (
            <Container maxWidth="md">
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    <Typography variant="h5" sx={{ mb: 2, color: selectedMethod.color }}>
                        Submitting to {selectedMethod.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Complete the submission form in the dialog above.
                    </Typography>
                </Paper>
            </Container>
        ),
        3: (
            <CompletionStep
                selectedMethod={selectedMethod}
                onSubmitAnother={handleSubmitAnother}
                onViewPublications={handleViewPublications}
            />
        )
    }), [
        submissionMethods, 
        selectedMethod, 
        handleMethodSelect, 
        handleSubmitAnother, 
        handleViewPublications, 
        serverDrafts,
        handleStartSubmission,
        handleResumeDraftFromStep,
        handleBackToServerSelection
    ]);

    return (
        <Box sx={{ width: '100%', mt: 8, mb: 0 }}>
            <PageHeader
                title="Submit Publication"
                description="Submit your research to preprint servers for early dissemination"
                icon={<PublishIcon />}
                breadcrumbs={[
                    { label: 'Dashboard', href: '/researcher' },
                    { label: 'Publications', href: '/researcher/publications' },
                    { label: 'Submit Publication' }
                ]}
            />
            
            {/* Progress Stepper */}
            <Paper sx={{ mb: 4, p: 3 }}>
                <Stepper activeStep={activeStep === 0 ? 0 : activeStep <= 2 ? 1 : 2} alternativeLabel>
                    {['Select Preprint Server', 'Submit Manuscript', 'Complete'].map((label, index) => (
                        <Step key={label}>
                            <StepLabel
                                StepIconProps={{
                                    sx: {
                                        '&.Mui-active': {
                                            color: selectedMethod?.color || '#8b6cbc'
                                        },
                                        '&.Mui-completed': {
                                            color: selectedMethod?.color || '#8b6cbc'
                                        }
                                    }
                                }}
                            >
                                {label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            {/* Step Content */}
            <Box sx={{ mb: 4, minHeight: 400 }}>
                <Suspense fallback={
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        minHeight: '300px' 
                    }}>
                        <CircularProgress sx={{ color: '#8b6cbc' }} />
                    </Box>
                }>
                    {stepComponents[activeStep]}
                </Suspense>

                {/* Lazy-loaded dialogs */}
                {methodDialogOpen && (
                    <SubmissionMethodDialog
                        open={methodDialogOpen}
                        onClose={handleCloseMethodDialog}
                        selectedMethod={selectedMethod}
                        submissionForm={submissionForm}
                        onFormUpdate={handleFormUpdate}
                        onPreview={handlePreview}
                        onSubmit={handleSubmitPublication}
                    />
                )}

                    {previewOpen && (
                        <PreviewDialog
                            open={previewOpen}
                            onClose={handleClosePreview}
                            submissionForm={submissionForm}
                            selectedMethod={selectedMethod}
                            onSubmit={handleSubmitPublication}
                        />
                    )}
            </Box>
        </Box>
    );
};

export default SubmitPublication;
