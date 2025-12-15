'use client';

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
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Groups as GroupsIcon,
  Circle as CircleIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styled Badge for online status indicator
const OnlineStatusBadge = styled(Badge)(({ theme, isOnline }) => ({
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
  onBack, 
  onInvite, 
  loading = false 
}) {
  // Build complete team list
  const buildTeamList = () => {
    const team = [];
    
    // Add active collaborators
    collaborators.forEach(collab => {
      team.push({
        id: collab.id,
        name: collab.name || `${collab.givenName || ''} ${collab.familyName || ''}`.trim(),
        email: collab.email,
        role: collab.role,
        avatar: collab.avatar || (collab.name ? collab.name.charAt(0).toUpperCase() : '?'),
        initials: collab.name ? collab.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase() : '?',
        isOnline: collab.id === currentUserId, // Current user is "online"
        isPending: false,
        color: getRoleColor(collab.role)
      });
    });
    
    // Add pending invitations
    pendingInvitations.forEach((invitation, idx) => {
      const name = invitation.name || `${invitation.givenName || ''} ${invitation.familyName || ''}`.trim();
      team.push({
        id: `pending-${idx}`,
        name: name || 'Pending User',
        email: invitation.email,
        role: invitation.role || 'Invited',
        avatar: name ? name.charAt(0).toUpperCase() : '?',
        initials: name ? name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase() : '?',
        isOnline: false,
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

        {/* Document Title */}
        <Box sx={{ flexGrow: 1, ml: 3 }}>
          {loading ? (
            <Skeleton 
              variant="text" 
              width="60%" 
              height={32}
              sx={{ fontSize: '1.25rem' }}
            />
          ) : (
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                fontSize: '1.25rem',
                color: '#333',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              {manuscript?.title || 'Untitled Document'}
            </Typography>
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
                                {member.name} {member.isOnline && '(You)'}
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

        {/* Invite Button */}
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
      </Stack>
    </Paper>
  );
}
