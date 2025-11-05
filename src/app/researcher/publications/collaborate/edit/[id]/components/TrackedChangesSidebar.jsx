'use client';

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Paper,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
  Skeleton,
  Stack,
  Divider,
  Menu,
  MenuItem,
  ButtonGroup
} from '@mui/material';
import {
  TrackChanges as TrackChangesIcon,
  CheckCircle as AcceptIcon,
  Cancel as RejectIcon,
  Close as CloseIcon,
  Add as InsertIcon,
  Remove as DeleteIcon,
  Edit as ReplaceIcon,
  FormatPaint as FormatIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

export default function TrackedChangesSidebar({ 
  manuscriptId, 
  open, 
  onClose, 
  trackChangesEnabled,
  onToggleTrackChanges,
  onChangeAccepted,
  onChangeRejected
}) {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, ACCEPTED, REJECTED
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [changeMenuAnchor, setChangeMenuAnchor] = useState(null);
  const [selectedChange, setSelectedChange] = useState(null);

  // Fetch tracked changes
  const fetchChanges = useCallback(async () => {
    if (!manuscriptId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/changes`);
      const data = await response.json();
      
      if (data.success) {
        setChanges(data.data);
      } else {
        console.error('Failed to fetch changes:', data.error);
      }
    } catch (error) {
      console.error('Error fetching changes:', error);
    } finally {
      setLoading(false);
    }
  }, [manuscriptId]);

  useEffect(() => {
    if (open) {
      fetchChanges();
    }
  }, [open, fetchChanges]);

  // Accept a change
  const handleAcceptChange = async (changeId) => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/changes/${changeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'ACCEPTED' })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchChanges(); // Refresh the list
        if (onChangeAccepted) {
          onChangeAccepted(data.data);
        }
      } else {
        console.error('Failed to accept change:', data.error);
      }
    } catch (error) {
      console.error('Error accepting change:', error);
    }
  };

  // Reject a change
  const handleRejectChange = async (changeId) => {
    try {
      const response = await fetch(`/api/manuscripts/${manuscriptId}/changes/${changeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'REJECTED' })
      });

      const data = await response.json();
      
      if (data.success) {
        fetchChanges(); // Refresh the list
        if (onChangeRejected) {
          onChangeRejected(data.data);
        }
      } else {
        console.error('Failed to reject change:', data.error);
      }
    } catch (error) {
      console.error('Error rejecting change:', error);
    }
  };

  // Accept all pending changes
  const handleAcceptAll = async () => {
    const pendingChanges = changes.filter(change => change.status === 'PENDING');
    
    for (const change of pendingChanges) {
      await handleAcceptChange(change.changeId);
    }
  };

  // Reject all pending changes
  const handleRejectAll = async () => {
    const pendingChanges = changes.filter(change => change.status === 'PENDING');
    
    for (const change of pendingChanges) {
      await handleRejectChange(change.changeId);
    }
  };

  const getChangeTypeIcon = (type) => {
    switch (type) {
      case 'INSERT': return <InsertIcon fontSize="small" sx={{ color: '#4caf50' }} />;
      case 'DELETE': return <DeleteIcon fontSize="small" sx={{ color: '#f44336' }} />;
      case 'REPLACE': return <ReplaceIcon fontSize="small" sx={{ color: '#ff9800' }} />;
      case 'FORMAT': return <FormatIcon fontSize="small" sx={{ color: '#2196f3' }} />;
      default: return <TrackChangesIcon fontSize="small" />;
    }
  };

  const getChangeTypeName = (type) => {
    switch (type) {
      case 'INSERT': return 'Insertion';
      case 'DELETE': return 'Deletion';
      case 'REPLACE': return 'Replacement';
      case 'FORMAT': return 'Formatting';
      default: return 'Change';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const filteredChanges = changes.filter(change => {
    if (filter === 'ALL') return true;
    return change.status === filter;
  });

  const pendingChangesCount = changes.filter(change => change.status === 'PENDING').length;

  if (!open) return null;

  return (
    <>
      <Paper sx={{ 
        width: 400, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 0,
        borderLeft: '1px solid #e0e0e0'
      }}>
        {/* Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid #e0e0e0'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrackChangesIcon color="primary" />
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                Track Changes
              </Typography>
            </Box>
            <Tooltip title="Close">
              <IconButton size="small" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Track Changes Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={trackChangesEnabled}
                onChange={(e) => onToggleTrackChanges(e.target.checked)}
                color="primary"
              />
            }
            label="Enable Track Changes"
            sx={{ mb: 2 }}
          />

          {/* Filter and Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              sx={{ fontSize: '0.8rem' }}
            >
              {filter === 'ALL' ? 'All Changes' : `${filter.toLowerCase()} Changes`}
            </Button>
            
            {pendingChangesCount > 0 && (
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={handleAcceptAll}
                  sx={{ fontSize: '0.7rem', px: 1 }}
                  color="success"
                >
                  Accept All
                </Button>
                <Button
                  onClick={handleRejectAll}
                  sx={{ fontSize: '0.7rem', px: 1 }}
                  color="error"
                >
                  Reject All
                </Button>
              </ButtonGroup>
            )}
          </Box>
        </Box>

        {/* Changes List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton height={60} />
                </Box>
              ))}
            </Box>
          ) : filteredChanges.length === 0 ? (
            <Box sx={{ 
              p: 4, 
              textAlign: 'center', 
              color: 'text.secondary' 
            }}>
              <TrackChangesIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
              <Typography variant="body1">
                {filter === 'ALL' ? 'No changes tracked yet' : `No ${filter.toLowerCase()} changes`}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {trackChangesEnabled 
                  ? 'Start editing to see tracked changes'
                  : 'Enable track changes to start tracking edits'
                }
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 1 }}>
              {filteredChanges.map((change) => (
                <ListItem 
                  key={change.id}
                  sx={{ 
                    mb: 1,
                    border: '1px solid #f0f0f0',
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'rgba(139, 108, 188, 0.05)',
                      borderColor: '#8b6cbc'
                    }
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    {/* Change Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: 1 
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getChangeTypeIcon(change.type)}
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {getChangeTypeName(change.type)}
                        </Typography>
                        <Chip
                          label={change.status}
                          size="small"
                          color={getStatusColor(change.status)}
                          variant="outlined"
                        />
                      </Box>
                      
                      {change.status === 'PENDING' ? (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Accept Change">
                            <IconButton 
                              size="small" 
                              onClick={() => handleAcceptChange(change.changeId)}
                              sx={{ color: '#4caf50' }}
                            >
                              <AcceptIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Change">
                            <IconButton 
                              size="small" 
                              onClick={() => handleRejectChange(change.changeId)}
                              sx={{ color: '#f44336' }}
                            >
                              <RejectIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            setChangeMenuAnchor(e.currentTarget);
                            setSelectedChange(change);
                          }}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    {/* Change Content */}
                    {change.type === 'DELETE' && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Deleted:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            bgcolor: '#ffcdd2', 
                            p: 0.5, 
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            textDecoration: 'line-through'
                          }}
                        >
                          "{change.content}"
                        </Typography>
                      </Box>
                    )}

                    {change.type === 'INSERT' && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Inserted:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            bgcolor: '#c8e6c9', 
                            p: 0.5, 
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.8rem'
                          }}
                        >
                          "{change.content}"
                        </Typography>
                      </Box>
                    )}

                    {change.type === 'REPLACE' && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Changed:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            bgcolor: '#ffcdd2', 
                            p: 0.5, 
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.8rem',
                            textDecoration: 'line-through',
                            mb: 0.5
                          }}
                        >
                          "{change.oldContent}"
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            bgcolor: '#c8e6c9', 
                            p: 0.5, 
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.8rem'
                          }}
                        >
                          "{change.content}"
                        </Typography>
                      </Box>
                    )}

                    {/* Change Metadata */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {change.author.givenName} {change.author.familyName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TimeIcon fontSize="small" color="action" />
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(change.createdAt), 'MMM d, h:mm a')}
                        </Typography>
                      </Box>
                    </Box>

                    {(change.acceptedAt || change.rejectedAt) && change.acceptedBy && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {change.status.toLowerCase()} by {change.acceptedBy.givenName} {change.acceptedBy.familyName}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Paper>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem 
          onClick={() => { setFilter('ALL'); setFilterMenuAnchor(null); }}
          selected={filter === 'ALL'}
        >
          All Changes ({changes.length})
        </MenuItem>
        <MenuItem 
          onClick={() => { setFilter('PENDING'); setFilterMenuAnchor(null); }}
          selected={filter === 'PENDING'}
        >
          Pending ({changes.filter(c => c.status === 'PENDING').length})
        </MenuItem>
        <MenuItem 
          onClick={() => { setFilter('ACCEPTED'); setFilterMenuAnchor(null); }}
          selected={filter === 'ACCEPTED'}
        >
          Accepted ({changes.filter(c => c.status === 'ACCEPTED').length})
        </MenuItem>
        <MenuItem 
          onClick={() => { setFilter('REJECTED'); setFilterMenuAnchor(null); }}
          selected={filter === 'REJECTED'}
        >
          Rejected ({changes.filter(c => c.status === 'REJECTED').length})
        </MenuItem>
      </Menu>

      {/* Change Actions Menu */}
      <Menu
        anchorEl={changeMenuAnchor}
        open={Boolean(changeMenuAnchor)}
        onClose={() => {
          setChangeMenuAnchor(null);
          setSelectedChange(null);
        }}
      >
        {selectedChange && selectedChange.status !== 'PENDING' && (
          <MenuItem 
            onClick={() => {
              // Reset to pending
              // This would require an additional API endpoint
              setChangeMenuAnchor(null);
              setSelectedChange(null);
            }}
          >
            Reset to Pending
          </MenuItem>
        )}
        <MenuItem 
          onClick={() => {
            // Scroll to change in document
            setChangeMenuAnchor(null);
            setSelectedChange(null);
          }}
        >
          Go to Change
        </MenuItem>
      </Menu>
    </>
  );
}



