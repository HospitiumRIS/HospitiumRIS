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
  Badge,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  InputBase,
  Collapse,
  Snackbar,
  Fade
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  CheckCircle as ResolvedIcon,
  RadioButtonUnchecked as OpenIcon,
  Comment as CommentIcon,
  QuestionAnswer as DiscussionIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChatBubbleOutline as ChatBubbleIcon,
  Lightbulb as SuggestionIcon,
  HelpOutline as QuestionIcon,
  Sort as SortIcon,
  FiberManualRecord as LiveIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material';
import { useState, useEffect, useCallback, useRef } from 'react';
import CommentThread from './CommentThread';
import AddCommentForm from './AddCommentForm';

// Real-time sync configuration
const SYNC_INTERVAL = 3000; // Poll every 3 seconds for real-time updates

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
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');
  
  // Real-time sync state
  const [isLive, setIsLive] = useState(true);
  const [newCommentNotification, setNewCommentNotification] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const lastCommentCountRef = useRef(0);
  const lastCommentIdsRef = useRef(new Set());
  const isSyncingRef = useRef(false);

  // Fetch comments from API (initial load)
  const fetchComments = useCallback(async (showLoading = true) => {
    if (!manuscriptId) return;

    if (showLoading) {
    setLoading(true);
    }
    setError(null);
    
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments`);
      const data = await response.json();
      
      if (data.success) {
        const newComments = data.data || [];
        setComments(newComments);
        
        // Update tracking refs
        lastCommentCountRef.current = newComments.length;
        lastCommentIdsRef.current = new Set(newComments.map(c => c.id));
        setLastSyncTime(new Date());
      } else {
        setError(data.error || 'Failed to load comments');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      if (showLoading) {
      setLoading(false);
      }
    }
  }, [manuscriptId]);

  // Silent sync for real-time updates (doesn't show loading indicator)
  const syncComments = useCallback(async () => {
    if (!manuscriptId || isSyncingRef.current) return;
    
    isSyncingRef.current = true;
    
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments`);
      const data = await response.json();
      
      if (data.success) {
        const serverComments = data.data || [];
        const serverCommentIds = new Set(serverComments.map(c => c.id));
        
        // Check for new comments from other users
        const newCommentsFromOthers = serverComments
          .filter(c => !lastCommentIdsRef.current.has(c.id))
          .filter(c => c.author?.id !== currentUserId); // Only notify for others' comments
        
        if (newCommentsFromOthers.length > 0) {
          // Show notification for new comments
          const latestNewComment = newCommentsFromOthers[newCommentsFromOthers.length - 1];
          const authorName = `${latestNewComment.author?.givenName || ''} ${latestNewComment.author?.familyName || ''}`.trim();
          setNewCommentNotification({
            count: newCommentsFromOthers.length,
            authorName: authorName || 'Someone',
            type: latestNewComment.type
          });
          
          // Auto-dismiss notification after 4 seconds
          setTimeout(() => setNewCommentNotification(null), 4000);
          
          // Apply highlights for new comments that have selected text (real-time sync)
          newCommentsFromOthers.forEach(comment => {
            if (comment.selectedText && comment.startOffset !== null && comment.endOffset !== null) {
              // Call onCommentCreated to add highlight in the editor
              if (onCommentCreated) {
                onCommentCreated(comment, {
                  text: comment.selectedText,
                  startOffset: comment.startOffset,
                  endOffset: comment.endOffset
                });
              }
            }
          });
        }
        
        // Check for deleted comments
        const deletedCommentIds = Array.from(lastCommentIdsRef.current)
          .filter(id => !serverCommentIds.has(id));
        
        // Remove highlights for deleted comments (real-time sync)
        if (deletedCommentIds.length > 0 && onCommentDeleted) {
          deletedCommentIds.forEach(commentId => {
            onCommentDeleted(commentId);
          });
        }
        
        // Check for updated comments (status changes, edits, new replies)
        const hasChanges = 
          newCommentsFromOthers.length > 0 || 
          deletedCommentIds.length > 0 ||
          serverComments.some(serverComment => {
            const localComment = comments.find(c => c.id === serverComment.id);
            if (!localComment) return true;
            
            // Check if status changed
            if (localComment.status !== serverComment.status) return true;
            
            // Check if content changed
            if (localComment.content !== serverComment.content) return true;
            
            // Check if replies count changed
            const localReplies = localComment.replies?.length || 0;
            const serverReplies = serverComment.replies?.length || 0;
            if (localReplies !== serverReplies) return true;
            
            return false;
          });
        
        if (hasChanges) {
          setComments(serverComments);
          lastCommentCountRef.current = serverComments.length;
          lastCommentIdsRef.current = serverCommentIds;
        }
        
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.error('Error syncing comments:', err);
      // Don't show error for background sync failures
    } finally {
      isSyncingRef.current = false;
    }
  }, [manuscriptId, currentUserId, comments, onCommentCreated, onCommentDeleted]);

  // Load comments on component mount
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Real-time polling for comment updates
  useEffect(() => {
    if (!manuscriptId || !isLive) return;

    const syncInterval = setInterval(syncComments, SYNC_INTERVAL);

    return () => {
      clearInterval(syncInterval);
    };
  }, [manuscriptId, isLive, syncComments]);

  // Handle focus comment events from highlight clicks
  useEffect(() => {
    const handleFocusComment = (event) => {
      const { commentId } = event.detail;
      
      setTimeout(() => {
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
          commentElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          commentElement.style.boxShadow = '0 0 0 3px rgba(139, 108, 188, 0.4)';
          commentElement.style.transition = 'box-shadow 0.3s ease';
          setTimeout(() => {
            commentElement.style.boxShadow = '';
          }, 2000);
        }
      }, 100);
    };

    document.addEventListener('focusComment', handleFocusComment);
    return () => document.removeEventListener('focusComment', handleFocusComment);
  }, []);

  // Add new comment
  const handleAddComment = async (commentData) => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData)
      });

      const data = await response.json();
      
      if (data.success) {
        const newComment = data.data;
        setComments(prev => [newComment, ...prev]);
        setShowAddForm(false);
        
        // Update tracking refs to include our own comment (prevent self-notification)
        lastCommentIdsRef.current.add(newComment.id);
        lastCommentCountRef.current += 1;
        
        if (onCommentCreated && commentData.selectedText) {
          onCommentCreated(newComment, {
            text: commentData.selectedText,
            startOffset: commentData.startOffset,
            endOffset: commentData.endOffset
          });
        }
        
        if (onClearSelection) onClearSelection();
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentCommentId })
      });

      const data = await response.json();
      
      if (data.success) {
        const newReply = data.data;
        
        setComments(prev => prev.map(comment => {
          if (comment.id === parentCommentId) {
            return { ...comment, replies: [...(comment.replies || []), newReply] };
          }
          return comment;
        }));
        
        // Track the reply ID to prevent self-notification
        lastCommentIdsRef.current.add(newReply.id);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const data = await response.json();
      
      if (data.success) {
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, content, updatedAt: new Date().toISOString() };
          }
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
        if (onCommentDeleted) onCommentDeleted(commentId);
        
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' })
      });

      const data = await response.json();
      
      if (data.success) {
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

  // Filter and sort comments
  const filteredComments = comments
    .filter(comment => {
      // Tab filter
      if (activeTab === 1 && comment.status === 'RESOLVED') return false;
      if (activeTab === 2 && comment.status !== 'RESOLVED') return false;
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesContent = comment.content.toLowerCase().includes(query);
        const matchesAuthor = `${comment.author.givenName} ${comment.author.familyName}`.toLowerCase().includes(query);
        const matchesSelectedText = comment.selectedText?.toLowerCase().includes(query);
        return matchesContent || matchesAuthor || matchesSelectedText;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const openCommentsCount = comments.filter(c => c.status !== 'RESOLVED').length;
  const resolvedCommentsCount = comments.filter(c => c.status === 'RESOLVED').length;
  const suggestionsCount = comments.filter(c => c.type === 'SUGGESTION').length;
  const questionsCount = comments.filter(c => c.type === 'QUESTION').length;

  return (
    <Paper sx={{ 
      width: 400, 
      borderRadius: 0, 
      borderLeft: '1px solid #e8e8e8',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      bgcolor: '#fafbfc'
    }}>
      {/* Professional Header */}
      <Box sx={{ 
        bgcolor: 'white',
        borderBottom: '1px solid #e8e8e8'
      }}>
        {/* Title Row */}
        <Box sx={{ p: 2, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ 
                width: 36, 
                height: 36, 
                borderRadius: 2, 
                bgcolor: '#8b6cbc15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DiscussionIcon sx={{ fontSize: 20, color: '#8b6cbc' }} />
              </Box>
              <Box>
                <Typography sx={{ 
                  fontWeight: 700, 
                  color: '#1a1a2e', 
                  fontSize: '1rem',
                  letterSpacing: '-0.01em'
                }}>
                  Discussion
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#666' }}>
                  {comments.length} {comments.length === 1 ? 'thread' : 'threads'}
          </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" spacing={0.5} alignItems="center">
              {/* Live Sync Indicator */}
              <Tooltip title={isLive ? `Live sync active${lastSyncTime ? ` • Last sync: ${lastSyncTime.toLocaleTimeString()}` : ''}` : 'Live sync paused'}>
                <Chip
                  icon={<LiveIcon sx={{ fontSize: '10px !important', animation: isLive ? 'pulse 2s infinite' : 'none' }} />}
                  label="Live"
                  size="small"
                  onClick={() => setIsLive(!isLive)}
                  sx={{
                    height: 22,
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    bgcolor: isLive ? '#e8f5e9' : '#f5f5f5',
                    color: isLive ? '#2e7d32' : '#999',
                    cursor: 'pointer',
                    '& .MuiChip-icon': { 
                      color: isLive ? '#4caf50' : '#999',
                      mr: -0.5
                    },
                    '& .MuiChip-label': { px: 0.75 },
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.4 }
                    }
                  }}
                />
              </Tooltip>
              
              <Tooltip title="Search comments">
                <IconButton 
                  size="small" 
                  onClick={() => setShowSearch(!showSearch)}
                  sx={{ 
                    bgcolor: showSearch ? '#8b6cbc15' : 'transparent',
                    color: showSearch ? '#8b6cbc' : '#666'
                  }}
                >
                  <SearchIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={() => fetchComments(false)} sx={{ color: '#666' }}>
                  <RefreshIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Search Bar */}
          <Collapse in={showSearch}>
            <Box sx={{ 
              mt: 1.5, 
              display: 'flex', 
              alignItems: 'center',
              bgcolor: '#f5f5f5',
              borderRadius: 2,
              px: 1.5,
              py: 0.5
            }}>
              <SearchIcon sx={{ fontSize: 18, color: '#999', mr: 1 }} />
              <InputBase
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flex: 1, fontSize: '0.85rem' }}
              />
              {searchQuery && (
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          </Collapse>
        </Box>

        {/* Stats Row */}
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5, 
          px: 2, 
          pb: 1.5,
          flexWrap: 'wrap'
        }}>
          <Chip
            icon={<OpenIcon sx={{ fontSize: '14px !important' }} />}
            label={`${openCommentsCount} Open`}
            size="small"
            sx={{
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 500,
              bgcolor: openCommentsCount > 0 ? '#fff3e0' : '#f5f5f5',
              color: openCommentsCount > 0 ? '#e65100' : '#888',
              '& .MuiChip-icon': { color: 'inherit' }
            }}
          />
          <Chip
            icon={<ResolvedIcon sx={{ fontSize: '14px !important' }} />}
            label={`${resolvedCommentsCount} Resolved`}
            size="small"
            sx={{ 
              height: 24,
              fontSize: '0.72rem',
              fontWeight: 500,
              bgcolor: resolvedCommentsCount > 0 ? '#e8f5e9' : '#f5f5f5',
              color: resolvedCommentsCount > 0 ? '#2e7d32' : '#888',
              '& .MuiChip-icon': { color: 'inherit' }
            }}
          />
          {suggestionsCount > 0 && (
            <Chip
              icon={<SuggestionIcon sx={{ fontSize: '14px !important' }} />}
              label={suggestionsCount}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.72rem',
                fontWeight: 500,
                bgcolor: '#fff8e1',
                color: '#f57c00',
                '& .MuiChip-icon': { color: 'inherit' }
              }}
            />
          )}
          {questionsCount > 0 && (
            <Chip
              icon={<QuestionIcon sx={{ fontSize: '14px !important' }} />}
              label={questionsCount}
              size="small"
              sx={{
                height: 24,
                fontSize: '0.72rem',
                fontWeight: 500,
                bgcolor: '#e3f2fd',
                color: '#1565c0',
                '& .MuiChip-icon': { color: 'inherit' }
              }}
            />
          )}
        </Box>

        {/* Filter Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, value) => setActiveTab(value)}
          variant="fullWidth"
          sx={{
            minHeight: 40,
            borderTop: '1px solid #f0f0f0',
            '& .MuiTab-root': {
              minHeight: 40,
              fontSize: '0.8rem',
              fontWeight: 500,
              textTransform: 'none',
              color: '#666',
              '&.Mui-selected': {
                color: '#8b6cbc',
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#8b6cbc',
              height: 2
            }
          }}
        >
          <Tab label="All" />
          <Tab label="Open" />
          <Tab label="Resolved" />
        </Tabs>
      </Box>

      {/* Add Comment Button - Floating Style */}
      <Box sx={{ p: 2, pt: 1.5 }}>
        <Button
          fullWidth
          variant={showAddForm ? "outlined" : "contained"}
          startIcon={showAddForm ? <CloseIcon /> : <AddIcon />}
          onClick={() => setShowAddForm(!showAddForm)}
          sx={{ 
            bgcolor: showAddForm ? 'transparent' : '#8b6cbc',
            borderColor: '#8b6cbc',
            color: showAddForm ? '#8b6cbc' : 'white',
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
            py: 1,
            boxShadow: showAddForm ? 'none' : '0 2px 8px rgba(139, 108, 188, 0.25)',
            '&:hover': { 
              bgcolor: showAddForm ? '#8b6cbc08' : '#7a5ca7',
              borderColor: '#7a5ca7'
            }
          }}
        >
          {showAddForm ? 'Cancel' : 'New Comment'}
        </Button>
      </Box>

      {/* Content Area */}
      <Box data-comments-list sx={{ flexGrow: 1, overflow: 'auto', px: 2, pb: 2 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2, borderRadius: 2 }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Selected Text Indicator */}
        {selectedText && !showAddForm && (
          <Box sx={{ 
            mb: 2, 
            p: 2, 
            bgcolor: 'white',
            borderRadius: 2, 
            border: '2px dashed #8b6cbc',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: '#8b6cbc08',
              borderColor: '#6b4f9e'
            }
          }}
          onClick={() => setShowAddForm(true)}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                borderRadius: '50%', 
                bgcolor: '#8b6cbc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CommentIcon sx={{ fontSize: 12, color: 'white' }} />
              </Box>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#8b6cbc' }}>
                Text selected — Click to comment
            </Typography>
            </Stack>
            <Typography sx={{ 
              fontSize: '0.82rem', 
              color: '#444',
              fontStyle: 'italic',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              "{selectedText.text}"
            </Typography>
          </Box>
        )}

        {/* Add Comment Form */}
        <Collapse in={showAddForm}>
          <Box sx={{ mb: 2 }}>
            <AddCommentForm
              selectedText={selectedText}
              onSubmit={handleAddComment}
              onCancel={() => setShowAddForm(false)}
            />
          </Box>
        </Collapse>

        {/* Comments List */}
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            py: 6 
          }}>
            <CircularProgress size={32} sx={{ color: '#8b6cbc', mb: 2 }} />
            <Typography sx={{ fontSize: '0.85rem', color: '#888' }}>
              Loading comments...
            </Typography>
          </Box>
        ) : filteredComments.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 6,
            px: 3
          }}>
            <Box sx={{ 
              width: 64, 
              height: 64, 
              borderRadius: 3, 
              bgcolor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2
            }}>
              <ChatBubbleIcon sx={{ fontSize: 32, color: '#bbb' }} />
            </Box>
            <Typography sx={{ 
              fontWeight: 600, 
              color: '#444', 
              fontSize: '0.95rem',
              mb: 0.75
            }}>
              {searchQuery ? 'No matches found' : 
               activeTab === 1 ? 'No open comments' : 
               activeTab === 2 ? 'No resolved comments' : 
               'Start the conversation'}
            </Typography>
            <Typography sx={{ 
              color: '#888', 
              fontSize: '0.82rem',
              lineHeight: 1.5,
              mb: 2
            }}>
              {searchQuery ? 'Try a different search term' :
               activeTab === 0 ? 'Select text in the document and add a comment to collaborate with your team.' :
               'Comments will appear here when available.'}
            </Typography>
            {!searchQuery && activeTab === 0 && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setShowAddForm(true)}
                sx={{ 
                  textTransform: 'none',
                  borderColor: '#ddd',
                  color: '#666',
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#8b6cbc',
                    color: '#8b6cbc',
                    bgcolor: '#8b6cbc08'
                  }
                }}
              >
                Add a comment
              </Button>
            )}
          </Box>
        ) : (
          <Stack spacing={0}>
            {filteredComments.map((comment, index) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onResolve={handleResolve}
                currentUserId={currentUserId}
                isLast={index === filteredComments.length - 1}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* New Comment Notification */}
      <Snackbar
        open={Boolean(newCommentNotification)}
        autoHideDuration={4000}
        onClose={() => setNewCommentNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={Fade}
        sx={{ 
          position: 'absolute',
          bottom: 16,
          right: 16,
          left: 'auto'
        }}
      >
        <Paper
          elevation={6}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            bgcolor: '#8b6cbc',
            color: 'white',
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover': { bgcolor: '#7a5ca7' }
          }}
          onClick={() => {
            setNewCommentNotification(null);
            // Scroll to top to see new comments
            const contentArea = document.querySelector('[data-comments-list]');
            if (contentArea) contentArea.scrollTop = 0;
          }}
        >
          <NotificationIcon sx={{ fontSize: 20 }} />
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {newCommentNotification?.count === 1 
                ? 'New comment' 
                : `${newCommentNotification?.count} new comments`}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', opacity: 0.9 }}>
              {newCommentNotification?.authorName} added a {newCommentNotification?.type?.toLowerCase() || 'comment'}
            </Typography>
          </Box>
          <CloseIcon 
            sx={{ fontSize: 16, ml: 1, opacity: 0.7, '&:hover': { opacity: 1 } }}
            onClick={(e) => {
              e.stopPropagation();
              setNewCommentNotification(null);
            }}
          />
        </Paper>
      </Snackbar>
    </Paper>
  );
}
