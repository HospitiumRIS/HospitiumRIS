'use client';

import {
  Box,
  Typography,
  Avatar,
  Stack,
  IconButton,
  Button,
  TextField,
  Menu,
  MenuItem,
  Chip,
  Tooltip,
  Divider,
  Paper,
  Collapse,
  AvatarGroup
} from '@mui/material';
import {
  MoreHoriz as MoreHorizIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  HelpOutline as QuestionMarkIcon,
  Lightbulb as SuggestionIcon,
  ChatBubbleOutline as CommentIcon,
  CheckCircle as ResolvedIcon,
  FormatQuote as QuoteIcon,
  Send as SendIcon,
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  SubdirectoryArrowRight as ReplyArrowIcon,
  AccountTree as ThreadIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';

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

const CommentItem = ({ 
  comment, 
  onReply, 
  onEdit, 
  onDelete, 
  onResolve, 
  currentUserId, 
  isReply = false,
  isLast = false,
  parentAuthorName = null,
  replyIndex = 0
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const isAuthor = comment.author?.id === currentUserId;
  const authorName = `${comment.author?.givenName || ''} ${comment.author?.familyName || ''}`.trim() || 'Unknown';
  const authorInitials = `${comment.author?.givenName?.charAt(0) || ''}${comment.author?.familyName?.charAt(0) || ''}`.toUpperCase() || '?';
  const avatarColor = stringToColor(authorName);
  const isResolved = comment.status === 'RESOLVED';

  const handleEditSave = () => {
    if (editContent.trim()) {
      onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleReplySave = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'SUGGESTION':
        return { 
          icon: <SuggestionIcon sx={{ fontSize: 14 }} />, 
          color: '#f57c00', 
          bgColor: '#fff8e1',
          borderColor: '#ffe0b2',
          label: 'Suggestion'
        };
      case 'QUESTION':
        return { 
          icon: <QuestionMarkIcon sx={{ fontSize: 14 }} />, 
          color: '#1565c0', 
          bgColor: '#e3f2fd',
          borderColor: '#bbdefb',
          label: 'Question'
        };
      default:
        return { 
          icon: <CommentIcon sx={{ fontSize: 14 }} />, 
          color: '#666', 
          bgColor: 'white',
          borderColor: '#e8e8e8',
          label: 'Comment'
        };
    }
  };

  const typeConfig = getTypeConfig(comment.type);

  return (
    <Box
      data-comment-id={comment.id}
      sx={{ 
        position: 'relative',
        transition: 'all 0.2s ease'
      }}
    >
      {/* Reply visual indicator - shows connection to parent */}
      {isReply && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 0.75,
          ml: 0.5
        }}>
          <ReplyArrowIcon sx={{ 
            fontSize: 14, 
            color: '#8b6cbc',
            transform: 'scaleX(-1)',
            mr: 0.75
          }} />
          <Typography sx={{ 
            fontSize: '0.7rem', 
            color: '#888',
            fontStyle: 'italic'
          }}>
            replying to <Box component="span" sx={{ fontWeight: 600, color: '#8b6cbc' }}>{parentAuthorName}</Box>
          </Typography>
        </Box>
      )}

      <Paper 
        elevation={0}
        sx={{ 
          p: 2,
          bgcolor: isResolved ? '#fafafa' : (isReply ? '#f9f8fc' : typeConfig.bgColor),
          border: `1px solid ${isResolved ? '#e0e0e0' : (isReply ? '#e8e4f2' : typeConfig.borderColor)}`,
          borderRadius: 2.5,
          opacity: isResolved ? 0.85 : 1,
          transition: 'all 0.2s ease',
          position: 'relative',
          // Reply visual indicator - left border accent
          ...(isReply && !isResolved && {
            borderLeft: '3px solid #8b6cbc50',
            pl: 2.5
          }),
          '&:hover': {
            borderColor: isResolved ? '#d0d0d0' : '#8b6cbc80',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            ...(isReply && !isResolved && {
              borderLeft: '3px solid #8b6cbc',
            })
          }
        }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="flex-start" spacing={1.5}>
          <Box sx={{ position: 'relative' }}>
        <Avatar
          sx={{
                width: isReply ? 28 : 32,
                height: isReply ? 28 : 32,
                fontSize: isReply ? '0.68rem' : '0.75rem',
                fontWeight: 600,
                bgcolor: avatarColor,
                flexShrink: 0
              }}
            >
              {authorInitials}
        </Avatar>
            {/* Reply indicator badge */}
            {isReply && (
              <Box sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                bgcolor: '#8b6cbc',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ReplyArrowIcon sx={{ fontSize: 8, color: 'white', transform: 'scaleX(-1)' }} />
              </Box>
            )}
          </Box>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }} flexWrap="wrap">
              <Typography sx={{ 
                fontWeight: 600, 
                color: '#1a1a2e', 
                fontSize: isReply ? '0.82rem' : '0.85rem',
                lineHeight: 1.3
              }}>
                {authorName}
        </Typography>
        
              {/* Reply badge for replies */}
              {isReply && (
                <Chip
                  icon={<ReplyArrowIcon sx={{ fontSize: '10px !important', transform: 'scaleX(-1)' }} />}
                  label="Reply"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 500,
                    bgcolor: '#8b6cbc15',
                    color: '#8b6cbc',
                    '& .MuiChip-icon': { color: '#8b6cbc', ml: 0.3 },
                    '& .MuiChip-label': { px: 0.5 }
                  }}
                />
              )}
              
              {!isReply && comment.type !== 'COMMENT' && (
                <Chip
                  icon={typeConfig.icon}
                  label={typeConfig.label}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    bgcolor: `${typeConfig.color}15`,
                    color: typeConfig.color,
                    border: `1px solid ${typeConfig.color}30`,
                    '& .MuiChip-icon': { 
                      color: typeConfig.color,
                      ml: 0.5
                    },
                    '& .MuiChip-label': { px: 0.75 }
                  }}
                />
              )}
              
              {isResolved && (
          <Chip 
                  icon={<ResolvedIcon sx={{ fontSize: '12px !important' }} />}
            label="Resolved" 
            size="small" 
            sx={{ 
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    bgcolor: '#e8f5e9',
                    color: '#2e7d32',
                    '& .MuiChip-icon': { color: '#2e7d32' },
                    '& .MuiChip-label': { px: 0.75 }
            }} 
          />
        )}
            </Stack>
            
            <Tooltip title={format(new Date(comment.createdAt), 'PPpp')}>
              <Typography sx={{ 
                fontSize: '0.72rem', 
                color: '#888',
                cursor: 'default'
              }}>
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                {comment.updatedAt && comment.updatedAt !== comment.createdAt && ' (edited)'}
              </Typography>
            </Tooltip>
          </Box>
        
        {!isReply && (
          <IconButton 
            size="small" 
            onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ 
                width: 28, 
                height: 28,
                color: '#999',
                '&:hover': { bgcolor: '#f0f0f0', color: '#666' }
              }}
            >
              <MoreHorizIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Stack>

        {/* Selected Text Quote */}
      {comment.selectedText && (
          <Box sx={{ 
            mt: 1.5, 
            p: 1.5, 
            bgcolor: '#f8f9fa', 
            borderRadius: 1.5, 
            borderLeft: '3px solid #8b6cbc',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1
          }}>
            <QuoteIcon sx={{ fontSize: 16, color: '#8b6cbc', mt: 0.25, flexShrink: 0 }} />
            <Typography sx={{ 
              fontSize: '0.82rem', 
              color: '#555', 
              fontStyle: 'italic',
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {comment.selectedText}
          </Typography>
        </Box>
      )}

      {/* Comment Content */}
      {isEditing ? (
          <Box sx={{ mt: 1.5 }}>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            size="small"
              autoFocus
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.85rem',
                  borderRadius: 1.5
                }
              }}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} justifyContent="flex-end">
              <Button 
                size="small" 
                onClick={() => { setEditContent(comment.content); setIsEditing(false); }}
                sx={{ 
                  textTransform: 'none',
                  color: '#666',
                  fontSize: '0.8rem'
                }}
              >
                Cancel
              </Button>
              <Button 
                size="small" 
                variant="contained"
                onClick={handleEditSave}
                disabled={!editContent.trim()}
                sx={{ 
                  textTransform: 'none',
                  bgcolor: '#8b6cbc',
                  fontSize: '0.8rem',
                  '&:hover': { bgcolor: '#7a5ca7' }
                }}
              >
              Save
            </Button>
          </Stack>
        </Box>
      ) : (
          <Typography sx={{ 
            mt: 1.5, 
            fontSize: '0.88rem', 
            color: '#333',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}>
          {comment.content}
        </Typography>
      )}

        {/* Action Buttons and Thread Info */}
        {!isReply && !isEditing && (
          <Stack 
            direction="row" 
            spacing={0.5} 
            sx={{ mt: 2 }}
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={0.5}>
              {!isResolved && (
                <>
          <Button
            size="small"
                    startIcon={<ReplyIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setIsReplying(!isReplying)}
                    sx={{ 
                      textTransform: 'none',
                      color: '#666',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
          >
            Reply
          </Button>
          
          {comment.type !== 'COMMENT' && (
            <Button
              size="small"
                      startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
              onClick={() => onResolve(comment.id)}
                      sx={{ 
                        textTransform: 'none',
                        color: '#27ae60',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1.5,
                        '&:hover': { bgcolor: '#e8f5e9' }
                      }}
            >
              Resolve
            </Button>
                  )}
                </>
              )}
            </Stack>
            
            {/* Thread count indicator */}
            {comment.replies?.length > 0 && (
              <Chip
                icon={<ThreadIcon sx={{ fontSize: '12px !important' }} />}
                label={`${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 500,
                  bgcolor: '#f0f4ff',
                  color: '#5c6bc0',
                  cursor: 'default',
                  '& .MuiChip-icon': { color: '#5c6bc0' },
                  '& .MuiChip-label': { px: 0.75 }
                }}
              />
          )}
        </Stack>
      )}

        {/* Reply Form */}
        <Collapse in={isReplying}>
          <Box sx={{ 
            mt: 2, 
            p: 2, 
            bgcolor: 'white', 
            borderRadius: 2, 
            border: '1px solid #8b6cbc30',
            borderLeft: '3px solid #8b6cbc'
          }}>
            {/* Reply target indicator */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <ReplyArrowIcon sx={{ fontSize: 14, color: '#8b6cbc', transform: 'scaleX(-1)' }} />
              <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                Replying to{' '}
                <Box component="span" sx={{ fontWeight: 600, color: '#8b6cbc' }}>
                  {authorName}
                </Box>
              </Typography>
            </Stack>
            
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder={`Reply to ${authorName}...`}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              size="small"
              autoFocus
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.85rem',
                  borderRadius: 1.5,
                  bgcolor: '#fafafa'
                }
              }}
            />
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} justifyContent="flex-end">
              <Button 
                size="small" 
                onClick={() => { setReplyContent(''); setIsReplying(false); }}
                sx={{ 
                  textTransform: 'none',
                  color: '#666',
                  fontSize: '0.8rem'
                }}
              >
                Cancel
              </Button>
              <Button 
                size="small" 
                variant="contained"
                startIcon={<SendIcon sx={{ fontSize: 14 }} />}
                onClick={handleReplySave}
                disabled={!replyContent.trim()}
                sx={{ 
                  textTransform: 'none',
                  bgcolor: '#8b6cbc',
                  fontSize: '0.8rem',
                  '&:hover': { bgcolor: '#7a5ca7' }
                }}
              >
                Send Reply
              </Button>
            </Stack>
          </Box>
        </Collapse>
      </Paper>

      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: { 
              minWidth: 160,
              borderRadius: 2,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              border: '1px solid #e8e8e8',
              mt: 0.5
            }
          }
        }}
      >
        {isAuthor && (
          <MenuItem 
            onClick={() => { setIsEditing(true); setMenuAnchor(null); }}
            sx={{ fontSize: '0.85rem', py: 1 }}
          >
            <EditIcon sx={{ mr: 1.5, fontSize: 18, color: '#666' }} />
            Edit
          </MenuItem>
        )}
        
        {isAuthor && (
          <MenuItem 
            onClick={() => { onDelete(comment.id); setMenuAnchor(null); }}
            sx={{ fontSize: '0.85rem', py: 1, color: '#e74c3c' }}
          >
            <DeleteIcon sx={{ mr: 1.5, fontSize: 18 }} />
            Delete
          </MenuItem>
        )}
        
        {!isResolved && comment.type !== 'COMMENT' && (
          <MenuItem 
            onClick={() => { onResolve(comment.id); setMenuAnchor(null); }}
            sx={{ fontSize: '0.85rem', py: 1, color: '#27ae60' }}
          >
            <CheckIcon sx={{ mr: 1.5, fontSize: 18 }} />
            Resolve
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default function CommentThread({ 
  comment, 
  onReply, 
  onEdit, 
  onDelete, 
  onResolve, 
  currentUserId,
  isLast = false
}) {
  const [showReplies, setShowReplies] = useState(true);
  const repliesCount = comment.replies?.length || 0;
  const parentAuthorName = `${comment.author?.givenName || ''} ${comment.author?.familyName || ''}`.trim() || 'Unknown';

  // Get unique authors in replies for avatar group preview
  const replyAuthors = comment.replies?.reduce((authors, reply) => {
    const authorId = reply.author?.id;
    if (authorId && !authors.find(a => a.id === authorId)) {
      authors.push({
        id: authorId,
        name: `${reply.author?.givenName || ''} ${reply.author?.familyName || ''}`.trim() || 'Unknown',
        initials: `${reply.author?.givenName?.charAt(0) || ''}${reply.author?.familyName?.charAt(0) || ''}`.toUpperCase() || '?'
      });
    }
    return authors;
  }, []) || [];

  return (
    <Box sx={{ 
      mb: 2,
      position: 'relative'
    }}>
      {/* Main Comment */}
      <CommentItem
        comment={comment}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onResolve={onResolve}
        currentUserId={currentUserId}
      />

      {/* Replies Section */}
      {repliesCount > 0 && (
        <Box sx={{ 
          mt: 1.5,
          position: 'relative'
        }}>
          {/* Thread connection line from parent to replies */}
          <Box sx={{
            position: 'absolute',
            left: 16,
            top: -8,
            bottom: showReplies ? 0 : 'auto',
            height: showReplies ? 'auto' : 24,
            width: 2,
            background: 'linear-gradient(to bottom, #8b6cbc 0%, #8b6cbc40 100%)',
            borderRadius: 1
          }} />

          {/* Collapse Toggle with thread indicator */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            ml: 4,
            mb: 1.5
          }}>
            {/* Thread branch indicator */}
            <Box sx={{
              position: 'absolute',
              left: 16,
              width: 12,
              height: 2,
              bgcolor: '#8b6cbc',
              borderRadius: 1
            }} />
            
            <Button
              size="small"
              startIcon={
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  bgcolor: '#8b6cbc15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {showReplies ? <CollapseIcon sx={{ fontSize: 14, color: '#8b6cbc' }} /> : <ExpandIcon sx={{ fontSize: 14, color: '#8b6cbc' }} />}
                </Box>
              }
              onClick={() => setShowReplies(!showReplies)}
              sx={{
                textTransform: 'none',
                color: '#666',
                fontSize: '0.78rem',
                fontWeight: 500,
                px: 1,
                py: 0.5,
                borderRadius: 2,
                bgcolor: 'white',
                border: '1px solid #e8e8e8',
                '&:hover': { 
                  bgcolor: '#f9f9f9', 
                  borderColor: '#8b6cbc40'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ fontSize: '0.78rem', color: '#666' }}>
                  {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}
                </Typography>
                
                {/* Preview of reply authors */}
                {replyAuthors.length > 0 && (
                  <AvatarGroup 
                    max={3} 
                    sx={{ 
                      '& .MuiAvatar-root': { 
                        width: 18, 
                        height: 18, 
                        fontSize: '0.55rem',
                        border: '1.5px solid white',
                        fontWeight: 600
                      }
                    }}
                  >
                    {replyAuthors.map((author, idx) => (
                      <Avatar 
                        key={author.id}
                        sx={{ bgcolor: stringToColor(author.name) }}
                      >
                        {author.initials}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                )}
              </Stack>
            </Button>
          </Box>

          <Collapse in={showReplies}>
            <Stack spacing={1.5} sx={{ 
              position: 'relative',
              ml: 4,
              pl: 2,
              borderLeft: '2px solid #8b6cbc30'
            }}>
              {comment.replies.map((reply, index) => (
            <CommentItem
              key={reply.id}
              comment={reply}
                  onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
                  onResolve={onResolve}
              currentUserId={currentUserId}
              isReply={true}
                  isLast={index === comment.replies.length - 1}
                  parentAuthorName={parentAuthorName}
                  replyIndex={index}
            />
          ))}
            </Stack>
          </Collapse>
        </Box>
      )}

      {/* Thread indicator when there are replies */}
      {repliesCount > 0 && (
        <Box sx={{
          position: 'absolute',
          left: 16,
          top: 40,
          width: 2,
          height: 'calc(100% - 40px)',
          display: showReplies ? 'none' : 'block'
        }} />
      )}
    </Box>
  );
}
