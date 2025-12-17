'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Avatar,
  Tooltip,
  Paper,
  Skeleton,
  Button,
  Badge,
  Divider,
  Chip,
  TextField,
  InputBase,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Groups as GroupsIcon,
  Circle as CircleIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled Badge for online status indicator
const OnlineStatusBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== 'isOnline'
})(({ theme, isOnline }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: isOnline ? '#44b700' : '#bdbdbd',
    color: isOnline ? '#44b700' : '#bdbdbd',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    width: 10,
    height: 10,
    borderRadius: '50%',
    '&::after': isOnline ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    } : {},
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

// Role colors
const getRoleColor = (role) => {
  const roleColors = {
    'OWNER': '#8b6cbc',
    'ADMIN': '#e53935',
    'EDITOR': '#fb8c00',
    'CONTRIBUTOR': '#43a047',
    'REVIEWER': '#1e88e5'
  };
  return roleColors[role] || '#8b6cbc';
};

export default function DocumentHeader({ 
  manuscript, 
  collaborators = [], 
  pendingInvitations = [],
  currentUserId,
  onlineUserIds = [], // Array of user IDs currently online from presence system
  canInvite = false, // Whether current user can invite others
  canEdit = false, // Whether current user can edit the document (including title)
  onBack, 
  onInvite,
  onTitleChange, // Callback when title is changed
  savingTitle = false, // Whether title is being saved
  loading = false 
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const titleInputRef = useRef(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Update edited title when manuscript title changes (for real-time sync)
  useEffect(() => {
    if (!isEditingTitle && manuscript?.title) {
      setEditedTitle(manuscript.title);
    }
  }, [manuscript?.title, isEditingTitle]);

  // Start editing title
  const handleStartEditTitle = () => {
    if (canEdit) {
      setEditedTitle(manuscript?.title || '');
      setIsEditingTitle(true);
    }
  };

  // Save title
  const handleSaveTitle = async () => {
    const trimmedTitle = editedTitle.trim();
    if (trimmedTitle && trimmedTitle !== manuscript?.title) {
      if (onTitleChange) {
        await onTitleChange(trimmedTitle);
      }
    }
    setIsEditingTitle(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditedTitle(manuscript?.title || '');
    setIsEditingTitle(false);
  };

  // Handle key press in title input
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Check if a user is online based on presence data
  const isUserOnline = (userId) => {
    return onlineUserIds.includes(userId);
  };

  // Build complete team list
  const buildTeamList = () => {
    const team = [];
    
    // Add creator first if available and not already in collaborators
    if (manuscript?.creator) {
      const creator = manuscript.creator;
      const creatorName = creator.name || `${creator.givenName || ''} ${creator.familyName || ''}`.trim();
      const creatorId = creator.id || manuscript.createdBy;
      
      // Check if creator is already in collaborators list
      const creatorInCollaborators = collaborators.some(c => c.userId === creatorId || c.id === creatorId);
      
      if (!creatorInCollaborators && creatorName) {
        team.push({
          id: `creator-${creatorId}`,
          userId: creatorId,
          name: creatorName,
          email: creator.email,
          role: 'OWNER',
          avatar: creatorName.charAt(0).toUpperCase(),
          initials: creatorName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase(),
          isOnline: isUserOnline(creatorId),
          isCurrentUser: creatorId === currentUserId,
          isPending: false,
          isCreator: true,
          color: '#8b6cbc'
        });
      }
    }
    
    // Add active collaborators
    collaborators.forEach(collab => {
      const collabName = collab.name || `${collab.givenName || ''} ${collab.familyName || ''}`.trim();
      const collabUserId = collab.userId || collab.id;
      team.push({
        id: collab.id,
        userId: collabUserId,
        name: collabName,
        email: collab.email,
        role: collab.role,
        avatar: collab.avatar || (collabName ? collabName.charAt(0).toUpperCase() : '?'),
        initials: collabName ? collabName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase() : '?',
        isOnline: isUserOnline(collabUserId),
        isCurrentUser: collabUserId === currentUserId,
        isPending: false,
        color: getRoleColor(collab.role)
      });
    });
    
    // Add pending invitations
    pendingInvitations.forEach((invitation, idx) => {
      const name = invitation.name || `${invitation.givenName || ''} ${invitation.familyName || ''}`.trim();
      team.push({
        id: `pending-${idx}`,
        userId: null,
        name: name || 'Pending User',
        email: invitation.email,
        role: invitation.role || 'Invited',
        avatar: name ? name.charAt(0).toUpperCase() : '?',
        initials: name ? name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase() : '?',
        isOnline: false,
        isCurrentUser: false,
        isPending: true,
        color: '#9e9e9e'
      });
    });
    
    return team;
  };

  const team = buildTeamList();
  const maxDisplayAvatars = 6;
  const displayedMembers = team.slice(0, maxDisplayAvatars);
  const remainingCount = team.length - displayedMembers.length;
  const onlineCount = team.filter(m => m.isOnline).length;
  const activeCount = team.filter(m => !m.isPending).length;
  const pendingCount = team.filter(m => m.isPending).length;

  return (
    <Paper sx={{ 
      borderRadius: 0,
      bgcolor: 'white',
      borderBottom: '1px solid #e0e0e0',
      py: 3,
      px: 4,
      mt: '50px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Back Button */}
        <IconButton 
          onClick={onBack}
          sx={{ 
            color: '#333',
            '&:hover': { bgcolor: '#f5f5f5' },
            mr: 1
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        
        <Typography 
          variant="button" 
          sx={{ 
            fontSize: '0.9rem',
            fontWeight: 500,
            color: '#333',
            cursor: 'pointer',
            '&:hover': { color: '#8b6cbc' }
          }}
          onClick={onBack}
        >
          Back
        </Typography>

        {/* Document Title - Editable */}
        <Box sx={{ flexGrow: 1, ml: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          {loading ? (
            <Skeleton 
              variant="text" 
              width="60%" 
              height={32}
              sx={{ fontSize: '1.25rem' }}
            />
          ) : isEditingTitle ? (
            // Editing mode
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <InputBase
                inputRef={titleInputRef}
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleSaveTitle}
                disabled={savingTitle}
                placeholder="Enter document title..."
                sx={{
                  flex: 1,
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#333',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: 'rgba(139, 108, 188, 0.08)',
                  border: '2px solid #8b6cbc',
                  '& input': {
                    padding: 0
                  }
                }}
              />
              {savingTitle ? (
                <CircularProgress size={20} sx={{ color: '#8b6cbc' }} />
              ) : (
                <>
                  <Tooltip title="Save (Enter)">
                    <IconButton 
                      size="small" 
                      onClick={handleSaveTitle}
                      sx={{ color: '#43a047' }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Cancel (Esc)">
                    <IconButton 
                      size="small" 
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                      onClick={handleCancelEdit}
                      sx={{ color: '#e53935' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          ) : (
            // Display mode
            <Tooltip title={canEdit ? "Click to rename" : ""} placement="bottom">
              <Box 
                onClick={handleStartEditTitle}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  cursor: canEdit ? 'pointer' : 'default',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  transition: 'all 0.2s ease',
                  '&:hover': canEdit ? {
                    bgcolor: 'rgba(139, 108, 188, 0.08)',
                    '& .edit-icon': {
                      opacity: 1
                    }
                  } : {}
                }}
              >
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    color: '#333',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    maxWidth: '500px'
                  }}
                >
                  {manuscript?.title || 'Untitled Document'}
                </Typography>
                {canEdit && (
                  <EditIcon 
                    className="edit-icon"
                    sx={{ 
                      fontSize: 18, 
                      color: '#8b6cbc',
                      opacity: 0,
                      transition: 'opacity 0.2s ease'
                    }} 
                  />
                )}
              </Box>
            </Tooltip>
          )}
        </Box>

        {/* Team Members Display */}
        <Stack direction="row" alignItems="center" spacing={2}>
          {loading ? (
            <>
              <Stack direction="row" spacing={-0.5}>
                {[1, 2, 3].map((index) => (
                  <Skeleton 
                    key={index} 
                    variant="circular" 
                    width={36} 
                    height={36} 
                    sx={{ border: '2px solid white' }}
                  />
                ))}
              </Stack>
              <Skeleton variant="text" width={100} height={20} />
            </>
          ) : (
            <>
              {/* Team Avatars with Online Status */}
              <Tooltip 
                title={
                  <Box sx={{ p: 1, minWidth: 200 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'white' }}>
                      Team Members ({team.length})
                    </Typography>
                    
                    {/* Active Members */}
                    {activeCount > 0 && (
                      <>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.5, display: 'block' }}>
                          Active ({activeCount})
                        </Typography>
                        {team.filter(m => !m.isPending).map((member) => (
                          <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                            <Box sx={{ position: 'relative' }}>
                              <Box sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: member.isOnline ? '#44b700' : '#bdbdbd'
                              }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500, fontSize: '0.8rem' }}>
                                {member.name} {member.isCurrentUser && '(You)'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>
                                {member.role} • {member.isOnline ? 'Online' : 'Offline'}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </>
                    )}
                    
                    {/* Pending Invitations */}
                    {pendingCount > 0 && (
                      <>
                        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, mb: 0.5, display: 'block' }}>
                          Pending Invitations ({pendingCount})
                        </Typography>
                        {team.filter(m => m.isPending).map((member) => (
                          <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                            <Box sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: '#f57c00'
                            }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '0.8rem' }}>
                                {member.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                                {member.role} • Invitation Sent
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </>
                    )}
                  </Box>
                }
                arrow
                placement="bottom-end"
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(45, 55, 72, 0.95)',
                      '& .MuiTooltip-arrow': {
                        color: 'rgba(45, 55, 72, 0.95)',
                      },
                      maxWidth: 280,
                      p: 0
                    }
                  }
                }}
              >
                <Stack 
                  direction="row" 
                  spacing={-0.75} 
                  sx={{ 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    '&:hover': {
                      '& .MuiAvatar-root': {
                        transform: 'scale(1.05)',
                        transition: 'transform 0.2s ease'
                      }
                    }
                  }}
                >
                  {displayedMembers.map((member, index) => (
                    <OnlineStatusBadge
                      key={member.id}
                      overlap="circular"
                      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                      variant="dot"
                      isOnline={member.isOnline}
                      invisible={member.isPending}
                    >
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          backgroundColor: member.isPending ? '#e0e0e0' : member.color,
                          color: member.isPending ? '#999' : 'white',
                          border: '2.5px solid white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          zIndex: 10 - index,
                          opacity: member.isPending ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          ...(member.isPending && {
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: -3,
                              right: -3,
                              width: 10,
                              height: 10,
                              backgroundColor: '#f57c00',
                              borderRadius: '50%',
                              border: '2px solid white'
                            }
                          })
                        }}
                      >
                        {member.initials}
                      </Avatar>
                    </OnlineStatusBadge>
                  ))}
                  
                  {/* Remaining count */}
                  {remainingCount > 0 && (
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: '#f5f5f5',
                        color: '#666',
                        border: '2.5px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        zIndex: 4
                      }}
                    >
                      +{remainingCount}
                    </Avatar>
                  )}
                </Stack>
              </Tooltip>

              {/* Team Info Text */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#333',
                    lineHeight: 1.2
                  }}
                >
                  {activeCount} member{activeCount !== 1 ? 's' : ''}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CircleIcon sx={{ fontSize: 8, color: '#44b700' }} />
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.7rem',
                      color: '#666'
                    }}
                  >
                    {onlineCount} online
                  </Typography>
                  {pendingCount > 0 && (
                    <>
                      <Typography variant="caption" sx={{ color: '#ccc', mx: 0.5 }}>•</Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '0.7rem',
                          color: '#f57c00'
                        }}
                      >
                        {pendingCount} pending
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </>
          )}
        </Stack>

        {/* Invite Button - Only show if user has invite permissions */}
        {canInvite && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<PersonAddIcon />}
            onClick={onInvite}
            sx={{ 
              borderColor: '#8b6cbc', 
              color: '#8b6cbc',
              fontSize: '0.8rem',
              py: 0.75,
              px: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#7a5ca7',
                bgcolor: 'rgba(139, 108, 188, 0.08)'
              }
            }}
          >
            Invite
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
