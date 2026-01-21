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
  MoreVert as MoreIcon,
  PendingActions as PendingIcon,
  TrendingUp as TrendingUpIcon
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
        width: 420, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        borderRadius: 0,
        borderLeft: '1px solid #e9ecef',
        boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #8b6cbc 0%, #9d7ec9 100%)',
          p: 2.5,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 2px 8px rgba(139, 108, 188, 0.15)'
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrackChangesIcon sx={{ fontSize: 24, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>
                  Track Changes
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.75rem' }}>
                  Review manuscript edits
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Close">
              <IconButton 
                size="small" 
                onClick={onClose}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Track Changes Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={trackChangesEnabled}
                onChange={(e) => onToggleTrackChanges(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: 'white'
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: 'rgba(255, 255, 255, 0.5)'
                  }
                }}
              />
            }
            label={<Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>Enable Track Changes</Typography>}
            sx={{ mb: 0 }}
          />
        </Box>

        {/* Stats Bar */}
        {!loading && changes.length > 0 && (
          <Box sx={{ 
            px: 2.5, 
            py: 2, 
            bgcolor: '#f8f9fa',
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            gap: 2,
            alignItems: 'center'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: '#8b6cbc15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrackChangesIcon sx={{ fontSize: 18, color: '#8b6cbc' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem', color: '#2d3748' }}>
                  {changes.length}
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.7rem' }}>
                  Total Changes
                </Typography>
              </Box>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                bgcolor: '#f59e0b15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PendingIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.125rem', color: '#2d3748' }}>
                  {pendingChangesCount}
                </Typography>
                <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.7rem' }}>
                  Pending
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Filter and Actions */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #e9ecef', bgcolor: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              size="small"
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              variant="outlined"
              sx={{ 
                fontSize: '0.8125rem',
                textTransform: 'none',
                borderColor: '#e2e8f0',
                color: '#64748b',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': {
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  bgcolor: '#8b6cbc05'
                }
              }}
            >
              {filter === 'ALL' ? 'All Changes' : `${filter.charAt(0) + filter.slice(1).toLowerCase()} Changes`}
            </Button>
            
            {pendingChangesCount > 0 && (
              <ButtonGroup size="small" variant="outlined">
                <Button
                  onClick={handleAcceptAll}
                  sx={{ 
                    fontSize: '0.75rem', 
                    px: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#10b981',
                    color: '#10b981',
                    '&:hover': {
                      borderColor: '#059669',
                      bgcolor: '#10b98110'
                    }
                  }}
                >
                  Accept All
                </Button>
                <Button
                  onClick={handleRejectAll}
                  sx={{ 
                    fontSize: '0.75rem', 
                    px: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      bgcolor: '#ef444410'
                    }
                  }}
                >
                  Reject All
                </Button>
              </ButtonGroup>
            )}
          </Box>
        </Box>

        {/* Changes List */}
        <Box sx={{ flexGrow: 1, overflow: 'auto', bgcolor: '#fafbfc' }}>
          {loading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton height={80} sx={{ borderRadius: 2 }} />
                </Box>
              ))}
            </Box>
          ) : filteredChanges.length === 0 ? (
            <Box sx={{ 
              p: 4, 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
              mt: 4
            }}>
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: 3,
                bgcolor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrackChangesIcon sx={{ fontSize: 40, color: '#cbd5e0' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#2d3748' }}>
                {filter === 'ALL' ? 'No changes tracked yet' : `No ${filter.toLowerCase()} changes`}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', maxWidth: 280, textAlign: 'center' }}>
                {trackChangesEnabled 
                  ? 'Start editing to see tracked changes'
                  : 'Enable track changes to start tracking edits'
                }
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 2 }}>
              {filteredChanges.map((change) => (
                <ListItem 
                  key={change.id}
                  sx={{ 
                    mb: 2,
                    p: 2,
                    border: '1px solid #e9ecef',
                    borderRadius: 2.5,
                    bgcolor: 'white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(139, 108, 188, 0.15)',
                      borderColor: '#8b6cbc',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    {/* Change Header */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: 1.5 
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getChangeTypeIcon(change.type)}
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#2d3748', fontSize: '0.875rem' }}>
                          {getChangeTypeName(change.type)}
                        </Typography>
                        <Chip
                          label={change.status}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 22,
                            ...(change.status === 'PENDING' ? {
                              bgcolor: '#f59e0b15',
                              color: '#f59e0b',
                              border: 'none'
                            } : change.status === 'ACCEPTED' ? {
                              bgcolor: '#10b98115',
                              color: '#10b981',
                              border: 'none'
                            } : {
                              bgcolor: '#ef444415',
                              color: '#ef4444',
                              border: 'none'
                            })
                          }}
                        />
                      </Box>
                      
                      {change.status === 'PENDING' ? (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Accept Change">
                            <IconButton 
                              size="small" 
                              onClick={() => handleAcceptChange(change.changeId)}
                              sx={{ 
                                color: '#64748b',
                                '&:hover': {
                                  color: '#10b981',
                                  bgcolor: '#10b98110'
                                }
                              }}
                            >
                              <AcceptIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject Change">
                            <IconButton 
                              size="small" 
                              onClick={() => handleRejectChange(change.changeId)}
                              sx={{ 
                                color: '#64748b',
                                '&:hover': {
                                  color: '#ef4444',
                                  bgcolor: '#ef444410'
                                }
                              }}
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
                          sx={{
                            color: '#64748b',
                            '&:hover': {
                              color: '#8b6cbc',
                              bgcolor: '#8b6cbc10'
                            }
                          }}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    {/* Change Content */}
                    {change.type === 'DELETE' && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
                          Deleted:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            bgcolor: '#fee2e2', 
                            p: 1.5, 
                            borderRadius: 2,
                            border: '1px solid #fecaca',
                            fontFamily: 'monospace',
                            fontSize: '0.8125rem',
                            textDecoration: 'line-through',
                            color: '#991b1b',
                            mt: 0.5
                          }}
                        >
                          "{change.content}"
                        </Typography>
                      </Box>
                    )}

                    {change.type === 'INSERT' && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
                          Inserted:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            bgcolor: '#d1fae5', 
                            p: 1.5, 
                            borderRadius: 2,
                            border: '1px solid #a7f3d0',
                            fontFamily: 'monospace',
                            fontSize: '0.8125rem',
                            color: '#065f46',
                            mt: 0.5
                          }}
                        >
                          "{change.content}"
                        </Typography>
                      </Box>
                    )}

                    {change.type === 'REPLACE' && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
                          Changed:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            bgcolor: '#fee2e2', 
                            p: 1.5, 
                            borderRadius: 2,
                            border: '1px solid #fecaca',
                            fontFamily: 'monospace',
                            fontSize: '0.8125rem',
                            textDecoration: 'line-through',
                            color: '#991b1b',
                            mb: 1,
                            mt: 0.5
                          }}
                        >
                          "{change.oldContent}"
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            bgcolor: '#d1fae5', 
                            p: 1.5, 
                            borderRadius: 2,
                            border: '1px solid #a7f3d0',
                            fontFamily: 'monospace',
                            fontSize: '0.8125rem',
                            color: '#065f46'
                          }}
                        >
                          "{change.content}"
                        </Typography>
                      </Box>
                    )}

                    {/* Change Metadata */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <PersonIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                        <Typography variant="caption" sx={{ color: '#4a5568', fontSize: '0.75rem', fontWeight: 500 }}>
                          {change.author.givenName} {change.author.familyName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <TimeIcon sx={{ fontSize: 16, color: '#8b6cbc' }} />
                        <Typography variant="caption" sx={{ color: '#4a5568', fontSize: '0.75rem' }}>
                          {format(new Date(change.createdAt), 'MMM d, h:mm a')}
                        </Typography>
                      </Box>
                      {(change.acceptedAt || change.rejectedAt) && change.acceptedBy && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <AcceptIcon sx={{ fontSize: 16, color: change.status === 'ACCEPTED' ? '#10b981' : '#ef4444' }} />
                          <Typography variant="caption" sx={{ color: '#4a5568', fontSize: '0.75rem' }}>
                            {change.status.toLowerCase()} by {change.acceptedBy.givenName} {change.acceptedBy.familyName}
                          </Typography>
                        </Box>
                      )}
                    </Box>
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



