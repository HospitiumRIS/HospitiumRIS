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
                                AI Summary (Academic)
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
                                AI Summary (Academic)
                            </Typography>
                        </Box>
                        
                        <Typography 
                            variant="body2" 
                            sx={{ 
                                mb: 2,
                                lineHeight: 1.6,
                                color: 'text.primary'
                            }}
                        >
                            {aiSummary}
                        </Typography>

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
