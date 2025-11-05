'use client';

import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import {
  Comment as CommentIcon,
  Lightbulb as SuggestionIcon,
  QuestionMark as QuestionMarkIcon,
  Close as CloseIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { useState } from 'react';

export default function AddCommentForm({ 
  selectedText = null, 
  onSubmit, 
  onCancel,
  placeholder = "Add a comment..."
}) {
  const [content, setContent] = useState('');
  const [commentType, setCommentType] = useState('COMMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        type: commentType,
        selectedText: selectedText?.text || null,
        startOffset: selectedText?.startOffset || null,
        endOffset: selectedText?.endOffset || null
      });
      
      // Reset form
      setContent('');
      setCommentType('COMMENT');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent('');
    setCommentType('COMMENT');
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Paper sx={{ 
      p: 3, 
      border: '1px solid #e0e0e0',
      borderRadius: 2,
      bgcolor: 'white'
    }}>
      {/* Selected Text Context */}
      {selectedText && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>
            Selected text:
          </Typography>
          <Box sx={{ 
            p: 1.5, 
            bgcolor: '#f8f9fa', 
            borderRadius: 1, 
            border: '1px solid #e9ecef',
            position: 'relative'
          }}>
            <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#555' }}>
              "{selectedText.text}"
            </Typography>
          </Box>
        </Box>
      )}

      {/* Comment Type Selector */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: '#666', mb: 1, display: 'block' }}>
          Comment type:
        </Typography>
        <ToggleButtonGroup
          value={commentType}
          exclusive
          onChange={(e, value) => value && setCommentType(value)}
          size="small"
          sx={{ 
            '& .MuiToggleButton-root': {
              py: 0.5,
              px: 1.5,
              fontSize: '0.75rem'
            }
          }}
        >
          <ToggleButton value="COMMENT" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CommentIcon sx={{ fontSize: 14 }} />
            Comment
          </ToggleButton>
          <ToggleButton value="SUGGESTION" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SuggestionIcon sx={{ fontSize: 14 }} />
            Suggestion
          </ToggleButton>
          <ToggleButton value="QUESTION" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <QuestionMarkIcon sx={{ fontSize: 14 }} />
            Question
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Comment Input */}
      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        sx={{ mb: 2 }}
        variant="outlined"
      />

      {/* Action Buttons */}
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<CloseIcon />}
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          sx={{ 
            bgcolor: '#8b6cbc',
            '&:hover': { bgcolor: '#7a5ca7' }
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Comment'}
        </Button>
      </Stack>
    </Paper>
  );
}

