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
  Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';

export default function DocumentHeader({ manuscript, collaborators, onBack, onInvite, loading = false }) {
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

        {/* Collaborator Info */}
        <Stack direction="row" alignItems="center" spacing={2}>
          {loading ? (
            <>
              <Stack direction="row" spacing={-0.5}>
                {[1, 2, 3].map((index) => (
                  <Skeleton 
                    key={index} 
                    variant="circular" 
                    width={32} 
                    height={32} 
                    sx={{ border: '2px solid white' }}
                  />
                ))}
              </Stack>
              <Skeleton variant="text" width={80} height={20} />
            </>
          ) : (
            <>
              <Stack direction="row" spacing={-0.5}>
                {collaborators.slice(0, 3).map((collaborator, index) => (
                  <Tooltip key={collaborator.id || index} title={`${collaborator.name} (${collaborator.role})`}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        backgroundColor: collaborator.color || '#8b6cbc',
                        border: '2px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }}
                    >
                      {collaborator.avatar || collaborator.name?.charAt(0) || '?'}
                    </Avatar>
                  </Tooltip>
                ))}
                {collaborators.length === 0 && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: '#8b6cbc',
                      border: '2px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }}
                  >
                    You
                  </Avatar>
                )}
              </Stack>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: '#666'
                }}
              >
                {collaborators.length > 0 
                  ? `${collaborators.length} collaborator${collaborators.length !== 1 ? 's' : ''}` 
                  : 'Solo work'
                }
              </Typography>
            </>
          )}
        </Stack>

        {/* Invite Button */}
        <Button
          variant="outlined"
          size="small"
          startIcon={<GroupsIcon />}
          onClick={onInvite}
          sx={{ 
            borderColor: '#8b6cbc', 
            color: '#8b6cbc',
            fontSize: '0.8rem',
            py: 0.5,
            px: 2,
            '&:hover': {
              borderColor: '#7a5ca7',
              bgcolor: 'rgba(139, 108, 188, 0.05)'
            }
          }}
        >
          Invite
        </Button>
      </Stack>
    </Paper>
  );
}
