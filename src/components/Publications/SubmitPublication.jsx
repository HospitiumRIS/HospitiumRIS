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
    Button,
    Divider
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
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
            height: '100%',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 8px 30px ${method.color}20`,
                borderColor: method.color,
            },
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 3
        }}
    >
        {hasDraft && (
            <Chip
                label="Draft"
                size="small"
                sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 2,
                    bgcolor: '#8b6cbc',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '0.65rem',
                    height: 22
                }}
            />
        )}

        <CardActionArea 
            onClick={() => onSelect(method)}
            sx={{ height: '100%', p: 0 }}
        >
            {/* Top accent bar */}
            <Box sx={{ height: 4, bgcolor: method.color }} />

            <CardContent sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                p: 3,
                pt: 3.5,
                pb: 3.5,
                flex: 1
            }}>
                <Box sx={{ mb: 2, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                        src={method.logo}
                        alt={`${method.name} logo`}
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                        loading="lazy"
                    />
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 700, color: method.color, mb: 0.5, fontSize: '1.1rem' }}>
                    {method.name}
                </Typography>

                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem', fontWeight: 600, letterSpacing: 1.2, mb: 1.5, textTransform: 'uppercase' }}>
                    {method.tagline}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
                    {method.description}
                </Typography>

                {hasDraft && draftInfo && (
                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(139, 108, 188, 0.06)', borderRadius: 1.5, width: '100%', border: '1px solid rgba(139, 108, 188, 0.15)' }}>
                        <Typography variant="caption" sx={{ color: '#8b6cbc', fontWeight: 600 }}>
                            "{draftInfo.title}" — saved {Math.round((Date.now() - draftInfo.lastSaved.getTime()) / (1000 * 60))}m ago
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </CardActionArea>
    </Card>
));

SubmissionMethodCard.displayName = 'SubmissionMethodCard';

// Memoized completion step
const CompletionStep = React.memo(({ selectedMethod, submissionResult, onSubmitAnother, onViewPublications }) => {
    const hasServerUrl = submissionResult?.serverResponse?.preprint?.url;
    const hasNodeUrl = submissionResult?.nodeUrl;
    const hasApiError = submissionResult?.apiError;
    const isSuccess = submissionResult?.success !== false;

    return (
        <Container maxWidth="sm">
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ 
                    width: 72, height: 72, borderRadius: '50%', 
                    bgcolor: isSuccess ? '#e8f5e9' : '#ffebee', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 
                }}>
                    <CheckCircleIcon sx={{ fontSize: 40, color: isSuccess ? '#4caf50' : '#f44336' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: isSuccess ? '#2e7d32' : '#c62828', mb: 1 }}>
                    {isSuccess ? 'Preprint Submitted Successfully!' : 'Submission Saved'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                    {isSuccess 
                        ? `Your manuscript has been submitted to ${selectedMethod?.name} and is now under review.`
                        : 'Your submission has been saved to your records.'}
                </Typography>

                {hasApiError && (
                    <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#fff3e0', border: '1px solid #ffb74d', borderRadius: 2, textAlign: 'left' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#e65100', mb: 1 }}>
                            ⚠️ Manual Completion Required
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                            {hasApiError}
                        </Typography>
                        {hasNodeUrl && (
                            <Button
                                variant="contained"
                                size="small"
                                href={hasNodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                endIcon={<OpenInNewIcon />}
                                sx={{ 
                                    bgcolor: '#ff9800',
                                    fontSize: '0.75rem',
                                    '&:hover': { bgcolor: '#f57c00' }
                                }}
                            >
                                Complete on OSF
                            </Button>
                        )}
                    </Paper>
                )}

                {hasServerUrl && (
                    <Paper sx={{ p: 2.5, mb: 3, bgcolor: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                            View on {selectedMethod?.name}
                        </Typography>
                        <Button
                            variant="outlined"
                            size="small"
                            href={submissionResult.serverResponse.preprint.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            endIcon={<OpenInNewIcon />}
                            sx={{ 
                                borderColor: selectedMethod?.color, 
                                color: selectedMethod?.color,
                                fontSize: '0.75rem',
                                '&:hover': { bgcolor: `${selectedMethod?.color}10` }
                            }}
                        >
                            Open Preprint
                        </Button>
                    </Paper>
                )}

                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        onClick={onSubmitAnother}
                        sx={{ bgcolor: '#8b6cbc', px: 3, py: 1.2, '&:hover': { bgcolor: '#7559a3' } }}
                    >
                        Submit Another Preprint
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={onViewPublications}
                        endIcon={<ArrowForwardIcon />}
                        sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', px: 3, py: 1.2, '&:hover': { borderColor: '#7559a3', bgcolor: 'rgba(139,108,188,0.04)' } }}
                    >
                        View All Submissions
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
});

CompletionStep.displayName = 'CompletionStep';

const SubmitPublication = ({ onSubmit }) => {
    const router = useRouter();
    
    // Core state management
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [serverDrafts, setServerDrafts] = useState({});
    const [submissionResult, setSubmissionResult] = useState(null);
    
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
        irb: false,
        // AfricArXiv / OSF specific fields
        osfToken: '',
        doi: ''
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
        },
        {
            id: 'africarxiv',
            name: 'AfricArXiv',
            tagline: 'OPEN ACCESS FOR AFRICAN RESEARCH',
            description: 'Submit preprint via OSF to AfricArXiv',
            logo: '/africarxiv.png',
            color: '#E07B27'
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
        router.push('/researcher/publications/preprints');
    }, [router]);

    const handlePreview = useCallback(() => {
        setPreviewOpen(true);
    }, []);

    const handleClosePreview = useCallback(() => {
        setPreviewOpen(false);
    }, []);

    const handleSubmitPublication = useCallback(async (formData) => {
        try {
            let serverResponse = null;
            let submissionStatus = 'PENDING';
            let serverUrl = null;
            let osfNodeId = null;
            let osfPreprintId = null;

            // Step 1: Submit to the preprint server (if AfricArXiv)
            if (selectedMethod?.id === 'africarxiv') {
                const africarxivFormData = new FormData();
                africarxivFormData.append('manuscript', formData.manuscript);
                africarxivFormData.append('title', formData.title);
                africarxivFormData.append('abstract', formData.abstract);
                africarxivFormData.append('subject', formData.subject || '');
                africarxivFormData.append('keywords', formData.keywords || '');
                africarxivFormData.append('license', formData.license || 'CC-BY-4.0');
                africarxivFormData.append('articleType', formData.articleType || '');
                if (formData.doi) {
                    africarxivFormData.append('doi', formData.doi);
                }

                const africarxivResponse = await fetch('/api/publications/submit-africarxiv', {
                    method: 'POST',
                    body: africarxivFormData,
                });

                serverResponse = await africarxivResponse.json();

                if (!africarxivResponse.ok) {
                    console.error('AfricArXiv submission failed:', {
                        status: africarxivResponse.status,
                        statusText: africarxivResponse.statusText,
                        response: serverResponse,
                    });
                }

                if (serverResponse.success) {
                    submissionStatus = 'UNDER_REVIEW';
                    serverUrl = serverResponse.preprint?.url || null;
                    osfNodeId = serverResponse.nodeId || null;
                    osfPreprintId = serverResponse.preprint?.id || null;
                } else {
                    console.error('AfricArXiv API error:', serverResponse.error, 'Step:', serverResponse.step);
                    
                    // If AfricArXiv submissions are disabled but node was created, save the node info
                    if (serverResponse.nodeId && serverResponse.nodeUrl) {
                        osfNodeId = serverResponse.nodeId;
                        serverUrl = serverResponse.nodeUrl;
                        submissionStatus = 'PENDING';
                    }
                }
            }

            // Step 2: Persist the submission to the database
            const keywordsArray = formData.keywords
                ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
                : [];

            const payload = {
                title: formData.title,
                authors: formData.authors,
                abstract: formData.abstract,
                articleType: formData.articleType,
                subject: formData.subject,
                keywords: keywordsArray,
                license: formData.license,
                server: selectedMethod?.id,
                serverName: selectedMethod?.name,
                manuscriptFileName: formData.manuscript?.name || null,
                manuscriptFileSize: formData.manuscript?.size || null,
                doi: formData.doi || null,
                ethicsStatement: formData.ethicsStatement || null,
                fundingStatement: formData.fundingStatement || null,
                status: submissionStatus,
                serverUrl,
                osfNodeId,
                osfPreprintId,
            };

            // Add OSF-specific metadata if AfricArXiv submission was successful
            if (serverResponse?.success && serverResponse.preprint) {
                const preprint = serverResponse.preprint;
                payload.osfReviewsState = preprint.reviewsState || null;
                payload.osfDateCreated = preprint.dateCreated || null;
                payload.osfDateModified = preprint.dateModified || null;
                payload.osfDatePublished = preprint.datePublished || null;
                payload.osfDateLastTransitioned = preprint.dateLastTransitioned || null;
                payload.osfIsPublished = preprint.isPublished || false;
                payload.osfIsPreprintOrphan = preprint.isPreprintOrphan || false;
                payload.osfLicenseRecord = preprint.licenseRecord || null;
                payload.osfHasCoi = preprint.hasCoI || false;
                payload.osfCoiStatement = preprint.conflictOfInterestStatement || null;
                payload.osfHasDoi = preprint.hasDoi || false;
                payload.osfArticleDoi = preprint.articleDoi || null;
                payload.osfPreprintDoiCreated = preprint.preprintDoiCreated || null;
                payload.osfPreprintDoiUrl = preprint.preprintDoiUrl || null;
                payload.osfDownloadUrl = preprint.downloadUrl || null;
            }

            const response = await fetch('/api/publications/preprints', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                console.error('Failed to save submission:', result.error);
            }

            // Clear the draft after successful submission
            if (selectedMethod) {
                localStorage.removeItem(`submission-draft-${selectedMethod.id}`);
            }

            // Store the submission result for the completion step
            setSubmissionResult({
                success: serverResponse?.success !== false,
                serverResponse,
                dbRecord: result.submission,
                apiError: serverResponse?.success === false ? serverResponse.error : null,
                nodeUrl: serverResponse?.nodeUrl || null,
            });

            if (onSubmit) {
                await onSubmit(formData, selectedMethod);
            }
            
            setMethodDialogOpen(false);
            setPreviewOpen(false);
            setActiveStep(3);
        } catch (error) {
            console.error('Submission error:', error);
            setSubmissionResult({
                success: false,
                error: error.message,
            });
            setActiveStep(3);
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
            <Container maxWidth="lg">
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Choose a Preprint Server
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Select where you would like to submit your manuscript
                    </Typography>
                </Box>
                <Grid container spacing={3} justifyContent="center">
                    {submissionMethods.map((method) => (
                        <Grid key={method.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <SubmissionMethodCard 
                                method={method} 
                                onSelect={handleMethodSelect}
                                hasDraft={!!serverDrafts[method.id]}
                                draftInfo={serverDrafts[method.id]}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Container>
        ),
        1: selectedMethod && (
            <Container maxWidth="sm">
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                            <img src={selectedMethod.logo} alt={selectedMethod.name} style={{ height: '100%', objectFit: 'contain' }} />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: selectedMethod.color, mb: 0.5 }}>
                            {selectedMethod.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {selectedMethod.tagline}
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 3 }} />

                    {serverDrafts[selectedMethod.id] ? (
                        <Box>
                            <Paper variant="outlined" sx={{ p: 2.5, mb: 3, bgcolor: 'rgba(139,108,188,0.04)', borderColor: 'rgba(139,108,188,0.25)', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ color: '#8b6cbc', fontWeight: 700, mb: 0.5 }}>
                                    Draft Available
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    "{serverDrafts[selectedMethod.id].title}"
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Saved {Math.round((Date.now() - serverDrafts[selectedMethod.id].lastSaved.getTime()) / (1000 * 60))} minutes ago
                                </Typography>
                            </Paper>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <Button variant="contained" onClick={handleResumeDraftFromStep} sx={{ bgcolor: '#8b6cbc', px: 3.5, py: 1.2, '&:hover': { bgcolor: '#7559a3' } }}>
                                    Resume Draft
                                </Button>
                                <Button variant="outlined" onClick={handleStartSubmission} sx={{ borderColor: '#8b6cbc', color: '#8b6cbc', px: 3.5, py: 1.2, '&:hover': { borderColor: '#7559a3', bgcolor: 'rgba(139,108,188,0.04)' } }}>
                                    Start Fresh
                                </Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Ready to submit your manuscript to {selectedMethod.name}
                            </Typography>
                            <Button variant="contained" size="large" onClick={handleStartSubmission} endIcon={<ArrowForwardIcon />} sx={{ bgcolor: '#8b6cbc', px: 5, py: 1.3, '&:hover': { bgcolor: '#7559a3' } }}>
                                Begin Submission
                            </Button>
                        </Box>
                    )}

                    <Button onClick={handleBackToServerSelection} size="small" sx={{ color: 'text.secondary', mt: 3, fontSize: '0.8rem' }}>
                        ← Back to Server Selection
                    </Button>
                </Paper>
            </Container>
        ),
        2: selectedMethod && (
            <Container maxWidth="sm">
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <img src={selectedMethod.logo} alt={selectedMethod.name} style={{ height: '100%', objectFit: 'contain' }} />
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1, color: selectedMethod.color, fontWeight: 600 }}>
                        Submitting to {selectedMethod.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Complete the submission form in the dialog.
                    </Typography>
                </Paper>
            </Container>
        ),
        3: (
            <CompletionStep
                selectedMethod={selectedMethod}
                submissionResult={submissionResult}
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
        handleBackToServerSelection,
        submissionResult
    ]);

    return (
        <Box sx={{ width: '100%', mt: 8, mb: 4 }}>
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
            <Container maxWidth="md" sx={{ mb: 4 }}>
                <Paper sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Stepper activeStep={activeStep === 0 ? 0 : activeStep <= 2 ? 1 : 2} alternativeLabel>
                        {['Select Preprint Server', 'Submit Manuscript', 'Complete'].map((label) => (
                            <Step key={label}>
                                <StepLabel
                                    StepIconProps={{
                                        sx: {
                                            '&.Mui-active': { color: selectedMethod?.color || '#8b6cbc' },
                                            '&.Mui-completed': { color: selectedMethod?.color || '#8b6cbc' }
                                        }
                                    }}
                                    sx={{ '& .MuiStepLabel-label': { fontSize: '0.85rem', fontWeight: 500 } }}
                                >
                                    {label}
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                </Paper>
            </Container>

            {/* Step Content */}
            <Box sx={{ minHeight: 380 }}>
                <Suspense fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
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
