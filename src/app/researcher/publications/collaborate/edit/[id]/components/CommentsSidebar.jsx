'use client';

import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  CheckCircle as ResolvedIcon,
  RadioButtonUnchecked as OpenIcon
} from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import CommentThread from './CommentThread';
import AddCommentForm from './AddCommentForm';

export default function CommentsSidebar({ 
  manuscriptId, 
  currentUserId, 
  selectedText = null,
  onClearSelection = null,
  onCommentCreated = null,
  onCommentDeleted = null
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Open, 2: Resolved

  // Fetch comments from API
  const fetchComments = useCallback(async () => {
    if (!manuscriptId) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments`);
      const data = await response.json();
      
      if (data.success) {
        setComments(data.data || []);
      } else {
        setError(data.error || 'Failed to load comments');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [manuscriptId]);

  // Load comments on component mount
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle focus comment events from highlight clicks
  useEffect(() => {
    const handleFocusComment = (event) => {
      const { commentId } = event.detail;
      
      // Find and scroll to the comment
      setTimeout(() => {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
          commentElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Add temporary highlight effect
          commentElement.style.backgroundColor = '#8b6cbc20';
          setTimeout(() => {
            commentElement.style.backgroundColor = '';
          }, 2000);
        }
      }, 100);
    };

    document.addEventListener('focusComment', handleFocusComment);

    return () => {
      document.removeEventListener('focusComment', handleFocusComment);
    };
  }, []);

  // Add new comment
  const handleAddComment = async (commentData) => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commentData)
      });

      const data = await response.json();
      
      if (data.success) {
        // Add new comment to the list
        setComments(prev => [data.data, ...prev]);
        setShowAddForm(false);
        
        // Create highlight if comment has selected text and callback is provided
        if (onCommentCreated && commentData.selectedText) {
          onCommentCreated(data.data, {
            text: commentData.selectedText,
            startOffset: commentData.startOffset,
            endOffset: commentData.endOffset
          });
        }
        
        // Clear text selection if provided
        if (onClearSelection) {
          onClearSelection();
        }
      } else {
        throw new Error(data.error || 'Failed to create comment');
      }
    } catch (err) {
      console.error('Error creating comment:', err);
      setError('Failed to create comment');
    }
  };

  // Add reply to existing comment
  const handleReply = async (parentCommentId, content) => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          parentCommentId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Add reply to the parent comment
        setComments(prev => prev.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), data.data]
            };
          }
          return comment;
        }));
      } else {
        throw new Error(data.error || 'Failed to add reply');
      }
    } catch (err) {
      console.error('Error adding reply:', err);
      setError('Failed to add reply');
    }
  };

  // Edit comment
  const handleEdit = async (commentId, content) => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the comment in the list
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, content, updatedAt: new Date().toISOString() };
          }
          // Check replies
          if (comment.replies) {
            const updatedReplies = comment.replies.map(reply =>
              reply.id === commentId 
                ? { ...reply, content, updatedAt: new Date().toISOString() }
                : reply
            );
            return { ...comment, replies: updatedReplies };
          }
          return comment;
        }));
      } else {
        throw new Error(data.error || 'Failed to edit comment');
      }
    } catch (err) {
      console.error('Error editing comment:', err);
      setError('Failed to edit comment');
    }
  };

  // Delete comment
  const handleDelete = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments/${commentId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove highlight if callback provided
        if (onCommentDeleted) {
          onCommentDeleted(commentId);
        }
        
        // Remove comment from the list
        setComments(prev => prev.filter(comment => {
          if (comment.id === commentId) return false;
          if (comment.replies) {
            comment.replies = comment.replies.filter(reply => reply.id !== commentId);
          }
          return true;
        }));
      } else {
        throw new Error(data.error || 'Failed to delete comment');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  // Resolve comment
  const handleResolve = async (commentId) => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'RESOLVED' })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update comment status
        setComments(prev => prev.map(comment =>
          comment.id === commentId 
            ? { ...comment, status: 'RESOLVED' }
            : comment
        ));
      } else {
        throw new Error(data.error || 'Failed to resolve comment');
      }
    } catch (err) {
      console.error('Error resolving comment:', err);
      setError('Failed to resolve comment');
    }
  };

  // Filter comments based on active tab
  const filteredComments = comments.filter(comment => {
    if (activeTab === 1) return comment.status !== 'RESOLVED'; // Open
    if (activeTab === 2) return comment.status === 'RESOLVED'; // Resolved
    return true; // All
  });

  const openCommentsCount = comments.filter(c => c.status !== 'RESOLVED').length;
  const resolvedCommentsCount = comments.filter(c => c.status === 'RESOLVED').length;

  return (
    <Paper sx={{ 
      width: 380, 
      borderRadius: 0, 
      borderLeft: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
            Comments & Suggestions
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setShowAddForm(true)}
            sx={{ 
              borderColor: '#8b6cbc',
              color: '#8b6cbc',
              '&:hover': { borderColor: '#7a5ca7', bgcolor: 'rgba(139, 108, 188, 0.05)' }
            }}
          >
            Add
          </Button>
        </Stack>

        {/* Filter Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, value) => setActiveTab(value)}
          sx={{ mt: 2 }}
        >
          <Tab 
            label={
              <Badge badgeContent={comments.length} color="primary" max={99}>
                All
              </Badge>
            } 
            sx={{ minWidth: 'auto', fontSize: '0.8rem' }}
          />
          <Tab 
            label={
              <Badge badgeContent={openCommentsCount} color="error" max={99}>
                Open
              </Badge>
            } 
            sx={{ minWidth: 'auto', fontSize: '0.8rem' }}
          />
          <Tab 
            label={
              <Badge badgeContent={resolvedCommentsCount} color="success" max={99}>
                Resolved
              </Badge>
            } 
            sx={{ minWidth: 'auto', fontSize: '0.8rem' }}
          />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {selectedText && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 1, border: '1px solid #bbdefb' }}>
            <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 500 }}>
              Text selected for commenting:
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic' }}>
              "{selectedText.text}"
            </Typography>
          </Box>
        )}

        {showAddForm && (
          <Box sx={{ mb: 3 }}>
            <AddCommentForm
              selectedText={selectedText}
              onSubmit={handleAddComment}
              onCancel={() => setShowAddForm(false)}
            />
          </Box>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredComments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="textSecondary">
              {activeTab === 1 ? 'No open comments' : 
               activeTab === 2 ? 'No resolved comments' : 
               'No comments yet. Start a conversation!'}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {filteredComments.map(comment => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onResolve={handleResolve}
                currentUserId={currentUserId}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
