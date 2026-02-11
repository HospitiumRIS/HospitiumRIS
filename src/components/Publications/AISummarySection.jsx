'use client';

import React from 'react';
import {
    Box,
    Typography,
    Chip,
    Skeleton,
    Alert,
    Collapse
} from '@mui/material';
import {
    AutoAwesome as AIIcon,
    Error as ErrorIcon
} from '@mui/icons-material';

/**
 * Sanitize and prepare HTML content for safe rendering
 */
const sanitizeHTML = (html) => {
    if (!html) return '';
    
    // Replace escaped newlines with actual newlines
    let cleaned = html.replace(/\\n/g, '\n');
    
    // Remove any script tags for safety
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    return cleaned;
};

/**
 * AISummarySection - Displays AI-generated summary and keywords for a publication
 */
const AISummarySection = ({ publication, expanded }) => {
    const { aiSummary, aiKeywords, aiGenerating, aiError } = publication;

    return (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box
                sx={{
                    backgroundColor: 'rgba(139, 108, 188, 0.08)',
                    borderTop: '1px solid rgba(139, 108, 188, 0.2)',
                    p: 2
                }}
            >
                {/* Loading State */}
                {aiGenerating && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AIIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ color: '#8b6cbc', fontWeight: 600 }}>
                                AI Summary
                            </Typography>
                        </Box>
                        <Skeleton variant="text" width="100%" height={20} />
                        <Skeleton variant="text" width="95%" height={20} />
                        <Skeleton variant="text" width="90%" height={20} />
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                            <Skeleton variant="rounded" width={80} height={24} />
                            <Skeleton variant="rounded" width={100} height={24} />
                            <Skeleton variant="rounded" width={90} height={24} />
                        </Box>
                    </Box>
                )}

                {/* Error State */}
                {aiError && !aiGenerating && (
                    <Alert 
                        severity="warning" 
                        icon={<ErrorIcon />}
                        sx={{ 
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            '& .MuiAlert-icon': { color: '#ff9800' }
                        }}
                    >
                        <Typography variant="body2">
                            AI summary generation failed: {aiError}
                        </Typography>
                    </Alert>
                )}

                {/* Success State */}
                {aiSummary && !aiGenerating && !aiError && (
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                            <AIIcon sx={{ color: '#8b6cbc', fontSize: 20 }} />
                            <Typography variant="subtitle2" sx={{ color: '#8b6cbc', fontWeight: 600 }}>
                                AI Summary
                            </Typography>
                        </Box>
                        
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
                            dangerouslySetInnerHTML={{ __html: sanitizeHTML(aiSummary) }}
                        />

                        {aiKeywords && aiKeywords.length > 0 && (
                            <Box>
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        color: 'text.secondary',
                                        fontWeight: 600,
                                        display: 'block',
                                        mb: 1
                                    }}
                                >
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
                )}

                {/* No Summary Yet (not generating, no error) */}
                {!aiSummary && !aiGenerating && !aiError && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        AI summary will be generated shortly...
                    </Typography>
                )}
            </Box>
        </Collapse>
    );
};

export default AISummarySection;
