import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Autocomplete,
  Stack,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  Groups as GroupsIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Link as LinkIcon,
  Send as SendIcon,
  Person as PersonIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const COLLABORATOR_ROLES = [
  { value: 'CONTRIBUTOR', label: 'Contributor', description: 'Can edit and contribute to the manuscript' },
  { value: 'REVIEWER', label: 'Reviewer', description: 'Can review and provide feedback' },
  { value: 'EDITOR', label: 'Editor', description: 'Can edit and manage manuscript structure' },
  { value: 'ADMIN', label: 'Admin', description: 'Full access including user management' }
];

// Custom hook for debouncing search queries
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function OrcidCollaboratorInvite({ 
  manuscriptId, 
  collaborators = [], 
  onCollaboratorsChange,
  readOnly = false 
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [orcidSearchData, setOrcidSearchData] = useState({
    givenNames: '',
    familyName: ''
  });
  const [orcidLoading, setOrcidLoading] = useState(false);
  const [orcidResults, setOrcidResults] = useState([]);
  const [orcidError, setOrcidError] = useState(null);
  const [hasSearchedOrcid, setHasSearchedOrcid] = useState(false);
  const [selectedResearcher, setSelectedResearcher] = useState(null);
  const [inviteRole, setInviteRole] = useState('CONTRIBUTOR');
  const [inviteMessage, setInviteMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Handle ORCID search input changes
  const handleOrcidInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setOrcidSearchData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasSearchedOrcid(false);
    setOrcidError(null);
  }, []);

  // Handle ORCID search (using same approach as registration)
  const handleOrcidSearch = useCallback(async () => {
    setOrcidLoading(true);
    setOrcidError(null);
    setHasSearchedOrcid(true);
    
    try {
      const baseUrl = 'https://pub.orcid.org/v3.0/expanded-search';
      const query = `given-names:${orcidSearchData.givenNames}+AND+family-name:${orcidSearchData.familyName}`;
      
      const response = await fetch(`${baseUrl}?q=${query}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ORCID data: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || typeof data['num-found'] === 'undefined') {
        setOrcidError('Received invalid data format from ORCID API');
        return;
      }

      if (data['num-found'] === 0 || !data['expanded-result'] || !data['expanded-result'].length) {
        setOrcidResults([]);
        setOrcidError('No matching ORCID profiles found. Please try different search terms.');
        return;
      }

      const processedResults = data['expanded-result']
        .filter(result => result['orcid-id'] && result['given-names'] && result['family-names'])
        .map(result => ({
          orcidId: result['orcid-id'],
          givenNames: result['given-names'],
          familyName: result['family-names'],
          displayName: `${result['given-names']} ${result['family-names']}`,
          affiliation: Array.isArray(result['institution-name']) && result['institution-name'].length > 0 
            ? result['institution-name'][0] 
            : '',
          affiliations: Array.isArray(result['institution-name']) ? result['institution-name'] : [],
          email: null // Will be fetched later if needed
        }))
        .slice(0, 10);

      setOrcidResults(processedResults);

      // Auto-select if only one result
      if (processedResults.length === 1) {
        handleResearcherSelect(processedResults[0]);
      }

      if (processedResults.length === 0) {
        setOrcidError('No valid ORCID profiles found. Please try different search terms.');
      }
    } catch (err) {
      console.error('ORCID search error:', err);
      setOrcidError('Failed to search ORCID. Please try again later.');
    } finally {
      setOrcidLoading(false);
    }
  }, [orcidSearchData]);

  // Clear ORCID search results
  const clearSearch = useCallback(() => {
    setOrcidResults([]);
    setOrcidSearchData({
      givenNames: '',
      familyName: ''
    });
    setHasSearchedOrcid(false);
    setOrcidError(null);
  }, []);

  // Handle researcher selection from search results
  const handleResearcherSelect = useCallback((researcher) => {
    setSelectedResearcher(researcher);
  }, []);


  const handleInviteCollaborator = useCallback(async () => {
    if (!selectedResearcher) return;

    console.log(`📧 FRONTEND: Starting invitation process:`, {
      manuscriptId: manuscriptId,
      researcher: selectedResearcher,
      role: inviteRole,
      message: inviteMessage
    });

    setIsInviting(true);

    try {
      if (manuscriptId) {
        // If manuscript exists, send actual invitation
        const response = await fetch('/api/manuscripts/invitations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            manuscriptId,
            orcidId: selectedResearcher.orcidId,
            email: selectedResearcher.email,
            givenName: selectedResearcher.givenNames,
            familyName: selectedResearcher.familyName,
            affiliation: selectedResearcher.affiliation,
            role: inviteRole,
            message: inviteMessage
          }),
        });

        const data = await response.json();

        console.log(`📧 FRONTEND: API Response:`, {
          status: response.status,
          success: data.success,
          data: data.data,
          error: data.error
        });

        if (!response.ok) {
          throw new Error(data.error || 'Failed to send invitation');
        }

        // Add to local collaborators list for display
        const newCollaborator = {
          id: `temp-${Date.now()}`,
          orcidId: selectedResearcher.orcidId,
          name: selectedResearcher.displayName,
          givenName: selectedResearcher.givenNames,
          familyName: selectedResearcher.familyName,
          affiliation: selectedResearcher.affiliation,
          email: selectedResearcher.email,
          role: inviteRole,
          status: 'PENDING',
          invitationId: data.data.invitation.id
        };

        onCollaboratorsChange([...collaborators, newCollaborator]);
      } else {
        // If manuscript doesn't exist yet, just add to local list
        const newCollaborator = {
          id: `temp-${Date.now()}`,
          orcidId: selectedResearcher.orcidId,
          name: selectedResearcher.displayName,
          givenName: selectedResearcher.givenNames,
          familyName: selectedResearcher.familyName,
          affiliation: selectedResearcher.affiliation,
          email: selectedResearcher.email,
          role: inviteRole,
          status: 'PENDING'
        };

        onCollaboratorsChange([...collaborators, newCollaborator]);
      }

      // Reset form
      setSelectedResearcher(null);
      setInviteRole('CONTRIBUTOR');
      setInviteMessage('');
      clearSearch();
      setSearchOpen(false);

      // Trigger notification refresh after a short delay to ensure DB is updated
      setTimeout(() => {
        console.log('🔔 Triggering notification refresh after invitation sent');
        // Dispatch a custom event to trigger notification refresh
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }, 1000);

    } catch (error) {
      console.error('Error inviting collaborator:', error);
      setOrcidError(error.message);
    } finally {
      setIsInviting(false);
    }
  }, [selectedResearcher, manuscriptId, inviteRole, inviteMessage, collaborators, onCollaboratorsChange]);

  const handleRemoveCollaborator = useCallback((collaboratorId) => {
    const updatedCollaborators = collaborators.filter(c => c.id !== collaboratorId);
    onCollaboratorsChange(updatedCollaborators);
  }, [collaborators, onCollaboratorsChange]);


  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Invite Collaborators
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Search for researchers using their given name and family name to find their ORCID profile and invite them to collaborate
      </Typography>

      {!readOnly && (
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setSearchOpen(true)}
          sx={{
            mb: 3,
            bgcolor: '#8b6cbc',
            '&:hover': {
              bgcolor: '#7b5ca7'
            }
          }}
        >
          Add Collaborator
        </Button>
      )}

      {collaborators.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', backgroundColor: '#fafbfd', border: '1px solid #e0e0e0' }}>
          <GroupsIcon sx={{ fontSize: 48, color: '#cbd5e0', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#718096', mb: 1, fontSize: '1.1rem' }}>
            No Collaborators Added Yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {readOnly 
              ? 'No collaborators have been added to this manuscript'
              : 'You can add collaborators now or later from the manuscript editor'
            }
          </Typography>
        </Paper>
      ) : (
        <List sx={{ bgcolor: '#fafbfd', borderRadius: 2, border: '1px solid #e0e0e0' }}>
          {collaborators.map((collaborator, index) => (
            <React.Fragment key={collaborator.id}>
              {index > 0 && <Divider />}
              <ListItem sx={{ py: 2 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#8b6cbc', color: 'white' }}>
                    {collaborator.name?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {collaborator.name}
                      </Typography>
                      <Chip
                        label={collaborator.role}
                        size="small"
                        sx={{
                          bgcolor: '#8b6cbc',
                          color: 'white',
                          fontSize: '0.7rem',
                          height: 20
                        }}
                      />
                      {collaborator.status === 'PENDING' && (
                        <Chip
                          label="Invitation Sent"
                          size="small"
                          sx={{
                            bgcolor: '#fff3cd',
                            color: '#856404',
                            fontSize: '0.7rem',
                            height: 20
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      {collaborator.orcidId && (
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                          <LinkIcon sx={{ fontSize: 14 }} />
                          ORCID: {collaborator.orcidId}
                        </Typography>
                      )}
                      {collaborator.affiliation && (
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BusinessIcon sx={{ fontSize: 14 }} />
                          {collaborator.affiliation}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                {!readOnly && (
                  <ListItemSecondaryAction>
                    <Tooltip title="Remove collaborator">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                        size="small"
                        sx={{ color: '#d32f2f' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Search Dialog */}
      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#8b6cbc', width: 40, height: 40 }}>
              <SearchIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Find ORCID Profile
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Search for researchers using their given name and family name
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent>
          {selectedResearcher ? (
            // Selected researcher form
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                Researcher selected! Choose their role and add a personal message.
              </Alert>
              
              <Paper
                sx={{
                  p: 2,
                  mb: 2,
                  border: '2px solid #8b6cbc',
                  bgcolor: 'rgba(139, 108, 188, 0.05)'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: '#8b6cbc',
                      color: 'white',
                      width: 40,
                      height: 40,
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    {selectedResearcher.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {selectedResearcher.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>ORCID:</strong> {selectedResearcher.orcidId}
                    </Typography>
                    {selectedResearcher.affiliations?.length > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Affiliations:</strong> {selectedResearcher.affiliations.join(', ')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>

              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Collaboration Role</InputLabel>
                    <Select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      label="Collaboration Role"
                    >
                      {COLLABORATOR_ROLES.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          <Box>
                            <Typography variant="body1">{role.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {role.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Personal Message (Optional)"
                    placeholder="Add a personal message to your invitation..."
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>
          ) : (
            // Simple ORCID search interface (like registration page)
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Search for researchers using their given name and family name to find their ORCID profile
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label="Given Names"
                  name="givenNames"
                  value={orcidSearchData.givenNames}
                  onChange={handleOrcidInputChange}
                  fullWidth
                  size="small"
                  placeholder="e.g., John, Maria"
                />
                <TextField
                  label="Family Name"
                  name="familyName"
                  value={orcidSearchData.familyName}
                  onChange={handleOrcidInputChange}
                  fullWidth
                  size="small"
                  placeholder="e.g., Smith, García"
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={handleOrcidSearch}
                  disabled={orcidLoading || !orcidSearchData.givenNames || !orcidSearchData.familyName}
                  startIcon={orcidLoading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                  sx={{
                    py: 1.5,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    bgcolor: '#8b6cbc',
                    '&:hover': {
                      bgcolor: '#7b5ca7'
                    }
                  }}
                >
                  Search ORCID
                </Button>
                {(orcidResults.length > 0 || hasSearchedOrcid) && (
                  <Button
                    variant="outlined"
                    onClick={clearSearch}
                    startIcon={<CloseIcon />}
                    sx={{ py: 1.5 }}
                  >
                    Clear
                  </Button>
                )}
              </Box>

              {orcidError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {orcidError}
                </Alert>
              )}

              {orcidResults.length > 0 && (
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    position: 'relative',
                    pt: 1.5,
                    maxHeight: '300px',
                    overflow: 'auto',
                    mb: 2
                  }}
                >
                  <Typography variant="subtitle2" sx={{ px: 2, pb: 1, color: '#8b6cbc', fontWeight: 600 }}>
                    Found {orcidResults.length} researchers:
                  </Typography>
                  <List dense>
                    {orcidResults.map((result) => (
                      <ListItem
                        key={result.orcidId}
                        divider
                        component="div"
                        onClick={() => handleResearcherSelect(result)}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemText
                          primary={result.displayName}
                          secondary={
                            <React.Fragment>
                              <span style={{ display: 'block', color: 'rgba(0, 0, 0, 0.87)', fontSize: '0.875rem' }}>
                                ORCID: {result.orcidId}
                              </span>
                              {result.affiliations.length > 0 && (
                                <span style={{ display: 'block', color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.875rem', marginTop: '2px' }}>
                                  Affiliations: {result.affiliations.join(', ')}
                                </span>
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {orcidResults.length === 0 && hasSearchedOrcid && !orcidLoading && orcidSearchData.givenNames && orcidSearchData.familyName && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  No ORCID profiles found matching your search. Please try different names.
                </Alert>
              )}

            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setSearchOpen(false)}>
            Cancel
          </Button>
          {selectedResearcher && (
            <>
              <Button 
                onClick={() => setSelectedResearcher(null)}
                color="inherit"
              >
                Back to Search
              </Button>
              <Button
                variant="contained"
                startIcon={isInviting ? <CircularProgress size={16} /> : <SendIcon />}
                onClick={handleInviteCollaborator}
                disabled={isInviting}
                sx={{
                  bgcolor: '#8b6cbc',
                  '&:hover': {
                    bgcolor: '#7b5ca7'
                  }
                }}
              >
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
