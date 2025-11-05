'use client';

import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Chip
} from '@mui/material';
import {
  Comment as CommentIcon,
  Lightbulb as SuggestionIcon,
  QuestionMark as QuestionMarkIcon
} from '@mui/icons-material';
import { useState, useEffect } from 'react';

export default function CommentTooltip() {
  const [tooltip, setTooltip] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const showTooltip = (event) => {
      console.log('Tooltip showTooltip event received:', event.detail);
      const { commentId, commentType, authorName, commentContent, x, y } = event.detail;
      
      setTooltip({
        commentId,
        commentType,
        authorName,
        commentContent: commentContent.length > 150 
          ? commentContent.substring(0, 150) + '...' 
          : commentContent
      });
      console.log('Tooltip state set:', {
        commentId,
        commentType,
        authorName,
        commentContent: commentContent.length > 150 
          ? commentContent.substring(0, 150) + '...' 
          : commentContent
      });
      
      // Position tooltip near mouse but ensure it stays in viewport
      const tooltipWidth = 320;
      const tooltipHeight = 120;
      const margin = 10;
      
      let tooltipX = x + margin;
      let tooltipY = y - tooltipHeight - margin;
      
      // Adjust if tooltip would go off screen
      if (tooltipX + tooltipWidth > window.innerWidth) {
        tooltipX = x - tooltipWidth - margin;
      }
      
      if (tooltipY < 0) {
        tooltipY = y + margin;
      }
      
      setPosition({ x: tooltipX, y: tooltipY });
    };

    const hideTooltip = () => {
      console.log('Hiding tooltip');
      setTooltip(null);
    };

    // Listen for custom events from the editor
    document.addEventListener('showCommentTooltip', showTooltip);
    document.addEventListener('hideCommentTooltip', hideTooltip);

    return () => {
      document.removeEventListener('showCommentTooltip', showTooltip);
      document.removeEventListener('hideCommentTooltip', hideTooltip);
    };
  }, []);

  const getCommentTypeIcon = (type) => {
    switch (type) {
      case 'SUGGESTION':
        return <SuggestionIcon sx={{ fontSize: 14, color: '#ff9800' }} />;
      case 'QUESTION':
        return <QuestionMarkIcon sx={{ fontSize: 14, color: '#2196f3' }} />;
      default:
        return <CommentIcon sx={{ fontSize: 14, color: '#4caf50' }} />;
    }
  };

  const getCommentTypeLabel = (type) => {
    switch (type) {
      case 'SUGGESTION':
        return 'Suggestion';
      case 'QUESTION':
        return 'Question';
      default:
        return 'Comment';
    }
  };

  const getCommentTypeColor = (type) => {
    switch (type) {
      case 'SUGGESTION':
        return '#ff9800';
      case 'QUESTION':
        return '#2196f3';
      default:
        return '#4caf50';
    }
  };

  if (!tooltip) {
    console.log('No tooltip to render');
    return null;
  }
  
  console.log('Rendering tooltip:', tooltip, position);

  return (
    <Paper
      sx={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: 320,
        maxWidth: '90vw',
        p: 2,
        zIndex: 10000,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: '1px solid #e0e0e0',
        borderRadius: 2,
        bgcolor: 'white',
        pointerEvents: 'none', // Allow mouse to pass through
      }}
    >
      <Stack spacing={1.5}>
        {/* Header with type and author */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar
            sx={{
              width: 20,
              height: 20,
              fontSize: '0.7rem',
              bgcolor: '#8b6cbc'
            }}
          >
            {tooltip.authorName?.charAt(0) || '?'}
          </Avatar>
          
          <Typography variant="caption" sx={{ fontWeight: 500, color: '#333', flexGrow: 1 }}>
            {tooltip.authorName || 'Unknown User'}
          </Typography>
          
          <Chip
            icon={getCommentTypeIcon(tooltip.commentType)}
            label={getCommentTypeLabel(tooltip.commentType)}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.65rem',
              bgcolor: `${getCommentTypeColor(tooltip.commentType)}15`,
              color: getCommentTypeColor(tooltip.commentType),
              '& .MuiChip-icon': {
                width: 12,
                height: 12
              }
            }}
          />
        </Stack>

        {/* Comment content */}
        <Typography 
          variant="body2" 
          sx={{ 
            color: '#555',
            lineHeight: 1.4,
            fontSize: '0.85rem'
          }}
        >
          {tooltip.commentContent}
        </Typography>

        {/* Footer hint */}
        <Typography 
          variant="caption" 
          sx={{ 
            color: '#999',
            fontSize: '0.7rem',
            fontStyle: 'italic',
            textAlign: 'center'
          }}
        >
          Click to view full comment
        </Typography>
      </Stack>
    </Paper>
  );
}
