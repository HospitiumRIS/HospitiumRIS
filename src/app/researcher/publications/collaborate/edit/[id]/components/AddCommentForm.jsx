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
  Divider,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  ChatBubbleOutline as CommentIcon,
  Lightbulb as SuggestionIcon,
  HelpOutline as QuestionMarkIcon,
  Close as CloseIcon,
  Send as SendIcon,
  FormatQuote as QuoteIcon,
  TextFields as TextIcon
} from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';

export default function AddCommentForm({ 
  selectedText = null, 
  onSubmit, 
  onCancel,
  placeholder = "Share your thoughts..."
}) {
  const [content, setContent] = useState('');
  const [commentType, setCommentType] = useState('COMMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textFieldRef = useRef(null);

  useEffect(() => {
    // Auto-focus the text field
    if (textFieldRef.current) {
      textFieldRef.current.focus();
    }
  }, []);

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
      
      setContent('');
      setCommentType('COMMENT');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCancel = () => {
    setContent('');
    setCommentType('COMMENT');
    if (onCancel) onCancel();
  };

  const typeOptions = [
    { 
      value: 'COMMENT', 
      icon: <CommentIcon sx={{ fontSize: 16 }} />, 
      label: 'Comment',
      color: '#666',
      description: 'General feedback'
    },
    { 
      value: 'SUGGESTION', 
      icon: <SuggestionIcon sx={{ fontSize: 16 }} />, 
      label: 'Suggestion',
      color: '#f57c00',
      description: 'Propose a change'
    },
    { 
      value: 'QUESTION', 
      icon: <QuestionMarkIcon sx={{ fontSize: 16 }} />, 
      label: 'Question',
      color: '#1565c0',
      description: 'Ask for clarification'
    }
  ];

  const selectedType = typeOptions.find(t => t.value === commentType);

  return (
    <Paper 
      elevation={0}
      sx={{ 
        border: '1px solid #e8e8e8',
        borderRadius: 3,
        bgcolor: 'white',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        px: 2.5, 
        py: 1.5, 
        bgcolor: '#fafbfc',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ 
            width: 24, 
            height: 24, 
            borderRadius: 1, 
            bgcolor: `${selectedType.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {selectedType.icon}
          </Box>
          <Typography sx={{ 
            fontWeight: 600, 
            fontSize: '0.85rem',
            color: '#333'
          }}>
            New {selectedType.label}
          </Typography>
        </Stack>
        <Tooltip title="Cancel">
          <IconButton 
            size="small" 
            onClick={handleCancel}
            sx={{ 
              width: 28, 
              height: 28,
              color: '#999',
              '&:hover': { bgcolor: '#f0f0f0' }
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ p: 2.5 }}>
        {/* Selected Text Preview */}
      {selectedText && (
          <Box sx={{ 
            mb: 2.5, 
            p: 2,
            bgcolor: '#f8f9fa', 
            borderRadius: 2, 
            borderLeft: '3px solid #8b6cbc'
          }}>
            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
              <QuoteIcon sx={{ fontSize: 18, color: '#8b6cbc', mt: 0.25 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ 
                  fontSize: '0.72rem', 
                  color: '#888',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  mb: 0.5
                }}>
                  Selected Text
                </Typography>
                <Typography sx={{ 
                  fontSize: '0.85rem', 
                  color: '#444',
                  fontStyle: 'italic',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
              "{selectedText.text}"
            </Typography>
          </Box>
            </Stack>
        </Box>
      )}

      {/* Comment Type Selector */}
        <Box sx={{ mb: 2.5 }}>
          <Typography sx={{ 
            fontSize: '0.75rem', 
            color: '#666',
            fontWeight: 500,
            mb: 1
          }}>
            Type
        </Typography>
          <Stack direction="row" spacing={1}>
            {typeOptions.map((type) => (
              <Tooltip key={type.value} title={type.description}>
                <Box
                  onClick={() => setCommentType(type.value)}
          sx={{ 
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.75,
                    py: 1,
              px: 1.5,
                    borderRadius: 2,
                    border: `2px solid ${commentType === type.value ? type.color : '#e8e8e8'}`,
                    bgcolor: commentType === type.value ? `${type.color}08` : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: type.color,
                      bgcolor: `${type.color}05`
                    }
                  }}
                >
                  <Box sx={{ color: commentType === type.value ? type.color : '#999' }}>
                    {type.icon}
                  </Box>
                  <Typography sx={{ 
                    fontSize: '0.78rem', 
                    fontWeight: commentType === type.value ? 600 : 500,
                    color: commentType === type.value ? type.color : '#666'
                  }}>
                    {type.label}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
          </Stack>
      </Box>

      {/* Comment Input */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ 
            fontSize: '0.75rem', 
            color: '#666',
            fontWeight: 500,
            mb: 1
          }}>
            Message
          </Typography>
      <TextField
            inputRef={textFieldRef}
        fullWidth
        multiline
        rows={4}
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
        variant="outlined"
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '0.9rem',
                bgcolor: '#fafbfc',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: '#f5f5f5'
                },
                '&.Mui-focused': {
                  bgcolor: 'white',
                  '& fieldset': {
                    borderColor: '#8b6cbc',
                    borderWidth: 2
                  }
                }
              }
            }}
          />
          <Typography sx={{ 
            fontSize: '0.7rem', 
            color: '#999',
            mt: 0.75,
            textAlign: 'right'
          }}>
            Press Ctrl+Enter to submit
          </Typography>
        </Box>

      {/* Action Buttons */}
        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={isSubmitting}
            sx={{ 
              textTransform: 'none',
              fontWeight: 500,
              borderColor: '#ddd',
              color: '#666',
              borderRadius: 2,
              px: 2.5,
              '&:hover': {
                borderColor: '#ccc',
                bgcolor: '#fafafa'
              }
            }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          sx={{ 
              textTransform: 'none',
              fontWeight: 600,
            bgcolor: '#8b6cbc',
              borderRadius: 2,
              px: 2.5,
              boxShadow: '0 2px 8px rgba(139, 108, 188, 0.25)',
              '&:hover': { 
                bgcolor: '#7a5ca7',
                boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)'
              },
              '&.Mui-disabled': {
                bgcolor: '#e0e0e0',
                color: '#999'
              }
            }}
          >
            {isSubmitting ? 'Posting...' : `Post ${selectedType.label}`}
        </Button>
      </Stack>
      </Box>
    </Paper>
  );
}
