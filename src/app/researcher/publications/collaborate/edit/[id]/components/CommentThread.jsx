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
  Paper
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  QuestionMark as QuestionMarkIcon,
  Lightbulb as SuggestionIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const CommentItem = ({ 
  comment, 
  onReply, 
  onEdit, 
  onDelete, 
  onResolve, 
  currentUserId, 
  isReply = false 
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const isAuthor = comment.author.id === currentUserId;
  const canEdit = isAuthor;
  const canDelete = isAuthor;

  const handleEditSave = () => {
    if (editContent.trim()) {
      onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleEditCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleReplySave = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    }
  };

  const getCommentTypeIcon = (type) => {
    switch (type) {
      case 'SUGGESTION':
        return <SuggestionIcon sx={{ fontSize: 12, color: '#ff9800' }} />;
      case 'QUESTION':
        return <QuestionMarkIcon sx={{ fontSize: 12, color: '#2196f3' }} />;
      default:
        return <CommentIcon sx={{ fontSize: 12, color: '#4caf50' }} />;
    }
  };

  const getCommentTypeColor = (type) => {
    switch (type) {
      case 'SUGGESTION':
        return '#fff3e0';
      case 'QUESTION':
        return '#e3f2fd';
      default:
        return '#f1f8e9';
    }
  };

  return (
    <Paper 
      data-comment-id={comment.id}
      sx={{ 
        p: 2, 
        mb: 1,
        ml: isReply ? 2 : 0,
        bgcolor: comment.status === 'RESOLVED' ? '#f5f5f5' : getCommentTypeColor(comment.type),
        border: `1px solid ${comment.status === 'RESOLVED' ? '#e0e0e0' : '#e8e8e8'}`,
        borderRadius: 2,
        opacity: comment.status === 'RESOLVED' ? 0.7 : 1
      }}
    >
      {/* Comment Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Avatar
          sx={{
            width: 24,
            height: 24,
            fontSize: '0.75rem',
            bgcolor: '#8b6cbc'
          }}
        >
          {comment.author.givenName?.charAt(0) || comment.author.email?.charAt(0)}
        </Avatar>
        
        <Typography variant="caption" sx={{ fontWeight: 500, color: '#333' }}>
          {comment.author.givenName} {comment.author.familyName}
        </Typography>
        
        {getCommentTypeIcon(comment.type)}
        
        <Typography variant="caption" sx={{ color: '#666' }}>
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
        </Typography>
        
        {comment.status === 'RESOLVED' && (
          <Chip 
            label="Resolved" 
            size="small" 
            sx={{ 
              height: 16, 
              fontSize: '0.6rem',
              bgcolor: '#4caf50',
              color: 'white'
            }} 
          />
        )}

        <Box sx={{ flexGrow: 1 }} />
        
        {!isReply && (
          <IconButton 
            size="small" 
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            sx={{ width: 20, height: 20 }}
          >
            <MoreVertIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
      </Stack>

      {/* Selected Text Context */}
      {comment.selectedText && (
        <Box sx={{ mb: 1.5, p: 1, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #e9ecef' }}>
          <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
            "{comment.selectedText}"
          </Typography>
        </Box>
      )}

      {/* Comment Content */}
      {isEditing ? (
        <Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            size="small"
            sx={{ mb: 1 }}
          />
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={handleEditSave} startIcon={<CheckIcon />}>
              Save
            </Button>
            <Button size="small" onClick={handleEditCancel} startIcon={<CloseIcon />}>
              Cancel
            </Button>
          </Stack>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.4 }}>
          {comment.content}
        </Typography>
      )}

      {/* Reply Form */}
      {isReplying && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            size="small"
            sx={{ mb: 1 }}
          />
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={handleReplySave} startIcon={<CheckIcon />}>
              Reply
            </Button>
            <Button size="small" onClick={() => setIsReplying(false)} startIcon={<CloseIcon />}>
              Cancel
            </Button>
          </Stack>
        </Box>
      )}

      {/* Action Buttons */}
      {!isReply && !isEditing && comment.status !== 'RESOLVED' && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            size="small"
            startIcon={<ReplyIcon />}
            onClick={() => setIsReplying(true)}
            sx={{ fontSize: '0.7rem' }}
          >
            Reply
          </Button>
          
          {comment.type !== 'COMMENT' && (
            <Button
              size="small"
              startIcon={<CheckIcon />}
              onClick={() => onResolve(comment.id)}
              sx={{ fontSize: '0.7rem', color: '#4caf50' }}
            >
              Resolve
            </Button>
          )}
        </Stack>
      )}

      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: { minWidth: 120 }
          }
        }}
      >
        {canEdit && (
          <MenuItem onClick={() => { setIsEditing(true); setMenuAnchor(null); }}>
            <EditIcon sx={{ mr: 1, fontSize: 16 }} />
            Edit
          </MenuItem>
        )}
        
        {canDelete && (
          <MenuItem onClick={() => { onDelete(comment.id); setMenuAnchor(null); }}>
            <DeleteIcon sx={{ mr: 1, fontSize: 16 }} />
            Delete
          </MenuItem>
        )}
        
        {comment.status !== 'RESOLVED' && (
          <MenuItem onClick={() => { onResolve(comment.id); setMenuAnchor(null); }}>
            <CheckIcon sx={{ mr: 1, fontSize: 16 }} />
            Resolve
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
};

export default function CommentThread({ 
  comment, 
  onReply, 
  onEdit, 
  onDelete, 
  onResolve, 
  currentUserId 
}) {
  return (
    <Box sx={{ mb: 3 }}>
      {/* Main Comment */}
      <CommentItem
        comment={comment}
        onReply={onReply}
        onEdit={onEdit}
        onDelete={onDelete}
        onResolve={onResolve}
        currentUserId={currentUserId}
      />

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <Box sx={{ ml: 2, mt: 1 }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onEdit={onEdit}
              onDelete={onDelete}
              currentUserId={currentUserId}
              isReply={true}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
