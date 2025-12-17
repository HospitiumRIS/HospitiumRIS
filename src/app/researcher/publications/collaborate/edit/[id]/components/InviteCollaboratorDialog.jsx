'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  InputAdornment,
  IconButton,
  Divider,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

// Role options with descriptions
const ROLE_OPTIONS = [
  { value: 'CONTRIBUTOR', label: 'Contributor', description: 'Can edit and comment on the document' },
  { value: 'REVIEWER', label: 'Reviewer', description: 'Can comment and suggest changes' },
  { value: 'EDITOR', label: 'Editor', description: 'Can edit, comment, and manage content' },
  { value: 'ADMIN', label: 'Admin', description: 'Full access including inviting others' }
];

export default function InviteCollaboratorDialog({
  open,
  onClose,
  manuscriptId,
  manuscriptTitle,
  onInviteSent
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedResearcher, setSelectedResearcher] = useState(null);
  const [selectedRole, setSelectedRole] = useState('CONTRIBUTOR');
  const [personalMessage, setPersonalMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);

  // Search for researchers by name or ORCID
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchError('Please enter at least 2 characters to search');
      return;
    }

    setSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const response = await fetch(`/api/orcid/search?q=${encodeURIComponent(searchQuery.trim())}&limit=10`);
      const data = await response.json();

      if (data.success && data.data) {
        setSearchResults(data.data);
        if (data.data.length === 0) {
          setSearchError('No researchers found. Try a different search term.');
        }
      } else {
        setSearchError(data.error || 'Failed to search researchers');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Failed to search. Please try again.');
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Handle selecting a researcher from search results
  const handleSelectResearcher = (researcher) => {
    setSelectedResearcher(researcher);
    setSearchResults([]);
    setSearchQuery('');
    setSendError(null);
    setSendSuccess(null);
  };

  // Clear selected researcher
  const handleClearSelection = () => {
    setSelectedResearcher(null);
    setSendError(null);
    setSendSuccess(null);
  };

  // Send invitation
  const handleSendInvitation = async () => {
    if (!selectedResearcher) {
      setSendError('Please select a researcher to invite');
      return;
    }

    setSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const response = await fetch('/api/manuscripts/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manuscriptId,
          orcidId: selectedResearcher.orcidId,
          email: selectedResearcher.email,
          givenName: selectedResearcher.givenName,
          familyName: selectedResearcher.familyName,
          affiliation: selectedResearcher.affiliation,
          role: selectedRole,
          message: personalMessage.trim() || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setSendSuccess(data.message || 'Invitation sent successfully!');
        setSelectedResearcher(null);
        setPersonalMessage('');
        setSelectedRole('CONTRIBUTOR');
        
        // Notify parent component
        if (onInviteSent) {
          onInviteSent(data.data.invitation);
        }
        
        // Close dialog after a short delay
        setTimeout(() => {
          onClose();
          setSendSuccess(null);
        }, 2000);
      } else {
        setSendError(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Invitation error:', error);
      setSendError('Failed to send invitation. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (!sending) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedResearcher(null);
      setSearchError(null);
      setSendError(null);
      setSendSuccess(null);
      setPersonalMessage('');
      setSelectedRole('CONTRIBUTOR');
      onClose();
    }
  };

  // Handle Enter key in search
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: '#8b6cbc',
        color: 'white',
        py: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddIcon />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Invite Collaborator
          </Typography>
        </Box>
        <IconButton onClick={handleClose} disabled={sending} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Document info */}
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Inviting to: <strong>{manuscriptTitle}</strong>
        </Typography>

        {/* Success message */}
        {sendSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleIcon />}>
            {sendSuccess}
          </Alert>
        )}

        {/* Error message */}
        {sendError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSendError(null)}>
            {sendError}
          </Alert>
        )}

        {/* Selected researcher display */}
        {selectedResearcher ? (
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              mb: 3, 
              bgcolor: 'rgba(139, 108, 188, 0.05)',
              borderColor: '#8b6cbc',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#8b6cbc', width: 48, height: 48 }}>
                  {selectedResearcher.givenName?.charAt(0) || '?'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedResearcher.givenName} {selectedResearcher.familyName}
                  </Typography>
                  {selectedResearcher.affiliation && (
                    <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BusinessIcon sx={{ fontSize: 14 }} />
                      {selectedResearcher.affiliation}
                    </Typography>
                  )}
                  {selectedResearcher.orcidId && (
                    <Chip 
                      label={`ORCID: ${selectedResearcher.orcidId}`}
                      size="small"
                      sx={{ mt: 0.5, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
              </Box>
              <IconButton size="small" onClick={handleClearSelection}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Paper>
        ) : (
          <>
            {/* Search input */}
            <TextField
              fullWidth
              label="Search Researchers"
              placeholder="Search by name or ORCID ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              disabled={searching}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searching ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : (
                  <InputAdornment position="end">
                    <Button 
                      size="small" 
                      onClick={handleSearch}
                      disabled={!searchQuery.trim()}
                      sx={{ textTransform: 'none' }}
                    >
                      Search
                    </Button>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 2 }}
            />

            {/* Search error */}
            {searchError && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {searchError}
              </Alert>
            )}

            {/* Search results */}
            {searchResults.length > 0 && (
              <Paper variant="outlined" sx={{ maxHeight: 250, overflow: 'auto', mb: 2 }}>
                <List dense>
                  {searchResults.map((researcher, index) => (
                    <ListItem
                      key={researcher.orcidId || index}
                      button
                      onClick={() => handleSelectResearcher(researcher)}
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(139, 108, 188, 0.08)'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: '#8b6cbc', width: 36, height: 36 }}>
                          {researcher.givenName?.charAt(0) || '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {researcher.givenName} {researcher.familyName}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            {researcher.affiliation && (
                              <Typography variant="caption" color="textSecondary" display="block">
                                {researcher.affiliation}
                              </Typography>
                            )}
                            {researcher.orcidId && (
                              <Typography variant="caption" color="primary">
                                ORCID: {researcher.orcidId}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Role selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Role</InputLabel>
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            label="Role"
            MenuProps={{ disableScrollLock: true }}
          >
            {ROLE_OPTIONS.map((role) => (
              <MenuItem key={role.value} value={role.value}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {role.label}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {role.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Personal message */}
        <TextField
          fullWidth
          label="Personal Message (Optional)"
          placeholder="Add a personal note to your invitation..."
          multiline
          rows={3}
          value={personalMessage}
          onChange={(e) => setPersonalMessage(e.target.value)}
          inputProps={{ maxLength: 500 }}
          helperText={`${personalMessage.length}/500 characters`}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f5f5f5' }}>
        <Button 
          onClick={handleClose} 
          disabled={sending}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSendInvitation}
          disabled={!selectedResearcher || sending}
          startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
          sx={{ 
            bgcolor: '#8b6cbc',
            textTransform: 'none',
            '&:hover': { bgcolor: '#7a5ca7' }
          }}
        >
          {sending ? 'Sending...' : 'Send Invitation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}



