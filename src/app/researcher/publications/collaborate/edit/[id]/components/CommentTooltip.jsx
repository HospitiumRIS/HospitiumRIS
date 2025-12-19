'use client';

import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Chip,
  Button,
  Divider,
  Fade
} from '@mui/material';
import {
  Comment as CommentIcon,
  Lightbulb as SuggestionIcon,
  HelpOutline as QuestionMarkIcon,
  OpenInNew as ViewIcon,
  Forum as ThreadIcon,
  FormatQuote as QuoteIcon,
  ArrowForward as ArrowIcon
} from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';

// Helper to get avatar color from string
const stringToColor = (string) => {
  if (!string) return '#8b6cbc';
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#6b4f9e', '#3498db', '#27ae60', '#e67e22', '#e74c3c', '#9b59b6', '#1abc9c', '#34495e'];
  return colors[Math.abs(hash) % colors.length];
};

export default function CommentTooltip() {
  const [tooltip, setTooltip] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [hideTimeout, setHideTimeout] = useState(null);

  const handleViewThread = useCallback(() => {
    if (tooltip?.commentId) {
      // Dispatch select event to scroll to comment in sidebar
      const selectEvent = new CustomEvent('selectComment', {
        detail: { commentId: tooltip.commentId }
      });
      document.dispatchEvent(selectEvent);
      
      // Also dispatch focus event
      const focusEvent = new CustomEvent('focusComment', {
        detail: { commentId: tooltip.commentId }
      });
      document.dispatchEvent(focusEvent);
      
      // Hide tooltip after clicking
      setTooltip(null);
    }
  }, [tooltip]);

  useEffect(() => {
    const showTooltip = (event) => {
      // Clear any pending hide timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        setHideTimeout(null);
      }
      
      const { commentId, commentType, authorName, commentContent, x, y, target } = event.detail;
      
      setTooltip({
        commentId,
        commentType,
        authorName,
        commentContent: commentContent || '',
        target
      });
      
      // Position tooltip near mouse but ensure it stays in viewport
      const tooltipWidth = 340;
      const tooltipHeight = 180;
      const margin = 15;
      
      let tooltipX = x + margin;
      let tooltipY = y - tooltipHeight - margin;
      
      // Adjust if tooltip would go off screen
      if (tooltipX + tooltipWidth > window.innerWidth) {
        tooltipX = x - tooltipWidth - margin;
      }
      
      if (tooltipY < 0) {
        tooltipY = y + margin + 20;
      }
      
      // Ensure minimum distance from edges
      tooltipX = Math.max(10, Math.min(tooltipX, window.innerWidth - tooltipWidth - 10));
      tooltipY = Math.max(10, tooltipY);
      
      setPosition({ x: tooltipX, y: tooltipY });
    };

    const hideTooltip = () => {
      // Delay hiding to allow mouse to move to tooltip
      const timeout = setTimeout(() => {
        if (!isHovering) {
          setTooltip(null);
        }
      }, 150);
      setHideTimeout(timeout);
    };

    // Listen for custom events from the editor
    document.addEventListener('showCommentTooltip', showTooltip);
    document.addEventListener('hideCommentTooltip', hideTooltip);

    return () => {
      document.removeEventListener('showCommentTooltip', showTooltip);
      document.removeEventListener('hideCommentTooltip', hideTooltip);
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [isHovering, hideTimeout]);

  const getCommentTypeConfig = (type) => {
    switch (type) {
      case 'SUGGESTION':
        return {
          icon: <SuggestionIcon sx={{ fontSize: 14 }} />,
          label: 'Suggestion',
          color: '#f57c00',
          bgColor: '#fff8e1',
          borderColor: '#ffe0b2'
        };
      case 'QUESTION':
        return {
          icon: <QuestionMarkIcon sx={{ fontSize: 14 }} />,
          label: 'Question',
          color: '#1565c0',
          bgColor: '#e3f2fd',
          borderColor: '#bbdefb'
        };
      default:
        return {
          icon: <CommentIcon sx={{ fontSize: 14 }} />,
          label: 'Comment',
          color: '#2e7d32',
          bgColor: '#e8f5e9',
          borderColor: '#c8e6c9'
        };
    }
  };

  if (!tooltip) {
    return null;
  }

  const typeConfig = getCommentTypeConfig(tooltip.commentType);
  const authorInitials = tooltip.authorName
    ?.split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  const avatarColor = stringToColor(tooltip.authorName);
  
  // Truncate content for preview
  const previewContent = tooltip.commentContent.length > 120
    ? tooltip.commentContent.substring(0, 120) + '...'
    : tooltip.commentContent;

  return (
    <Fade in={true} timeout={150}>
      <Paper
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setTooltip(null);
        }}
        sx={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: 340,
          maxWidth: '90vw',
          zIndex: 10000,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1)',
          border: `1px solid ${typeConfig.borderColor}`,
          borderRadius: 3,
          bgcolor: 'white',
          overflow: 'hidden',
          cursor: 'default'
        }}
      >
        {/* Colored header bar */}
        <Box sx={{ 
          height: 4, 
          bgcolor: typeConfig.color,
          background: `linear-gradient(90deg, ${typeConfig.color} 0%, ${typeConfig.color}99 100%)`
        }} />
        
        <Box sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            {/* Header with type badge and author */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  bgcolor: avatarColor
                }}
              >
                {authorInitials}
              </Avatar>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography sx={{ 
                  fontWeight: 600, 
                  color: '#1a1a2e', 
                  fontSize: '0.88rem',
                  lineHeight: 1.2
                }}>
                  {tooltip.authorName || 'Unknown User'}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Chip
                    icon={typeConfig.icon}
                    label={typeConfig.label}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 500,
                      bgcolor: typeConfig.bgColor,
                      color: typeConfig.color,
                      border: `1px solid ${typeConfig.borderColor}`,
                      '& .MuiChip-icon': {
                        color: typeConfig.color
                      },
                      '& .MuiChip-label': { px: 0.75 }
                    }}
                  />
                </Stack>
              </Box>
            </Stack>

            {/* Comment content preview */}
            <Box sx={{ 
              p: 1.5, 
              bgcolor: '#f8f9fa', 
              borderRadius: 2,
              borderLeft: `3px solid ${typeConfig.color}`
            }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <QuoteIcon sx={{ fontSize: 14, color: typeConfig.color, mt: 0.25, flexShrink: 0 }} />
                <Typography 
                  sx={{ 
                    color: '#444',
                    lineHeight: 1.5,
                    fontSize: '0.85rem',
                    fontStyle: 'italic'
                  }}
                >
                  {previewContent || 'No content'}
                </Typography>
              </Stack>
            </Box>

            {/* Action button */}
            <Button
              fullWidth
              variant="contained"
              size="small"
              startIcon={<ThreadIcon sx={{ fontSize: 16 }} />}
              endIcon={<ArrowIcon sx={{ fontSize: 14 }} />}
              onClick={handleViewThread}
              sx={{
                bgcolor: typeConfig.color,
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                py: 1,
                borderRadius: 2,
                boxShadow: `0 2px 8px ${typeConfig.color}40`,
                '&:hover': {
                  bgcolor: typeConfig.color,
                  filter: 'brightness(0.9)',
                  boxShadow: `0 4px 12px ${typeConfig.color}50`
                }
              }}
            >
              View Full Thread
            </Button>

            {/* Keyboard hint */}
            <Typography 
              sx={{ 
                color: '#aaa',
                fontSize: '0.68rem',
                textAlign: 'center',
                fontStyle: 'italic'
              }}
            >
              Or click the highlighted text
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Fade>
  );
}
