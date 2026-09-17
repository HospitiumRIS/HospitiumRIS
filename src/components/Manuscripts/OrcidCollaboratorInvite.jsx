import { useTranslation } from 'react-i18next';
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
import { alpha } from '@mui/material/styles';
import { getInstitutionalEmailError, isInstitutionalEmail, normalizeEmail } from '../../lib/institutional-email';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '&:hover fieldset': { borderColor: '#8b6cbc' },
    '&.Mui-focused fieldset': { borderColor: '#8b6cbc' }
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#8b6cbc' }
};

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
  readOnly = false,
  embedded = false
}) {
  const { t } = useTranslation();
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  const emailError = getInstitutionalEmailError(inviteEmail);

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
    setEmailTouched(false);
    const candidate = researcher?.email ? normalizeEmail(researcher.email) : '';
    setInviteEmail(isInstitutionalEmail(candidate) ? candidate : '');
  }, []);


  const handleInviteCollaborator = useCallback(async () => {
    if (!selectedResearcher) return;

    const normalizedEmail = normalizeEmail(inviteEmail);
    const validationError = getInstitutionalEmailError(normalizedEmail);
    if (validationError) {
      setEmailTouched(true);
      setOrcidError(validationError);
      return;
    }

    console.log(`📧 FRONTEND: Starting invitation process:`, {
      manuscriptId: manuscriptId,
      researcher: selectedResearcher,
      email: normalizedEmail,
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
            email: normalizedEmail,
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
          email: normalizedEmail,
          role: inviteRole,
          message: inviteMessage,
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
          email: normalizedEmail,
          role: inviteRole,
          message: inviteMessage,
          status: 'PENDING'
        };

        onCollaboratorsChange([...collaborators, newCollaborator]);
      }

      // Reset form
      setSelectedResearcher(null);
      setInviteRole('CONTRIBUTOR');
      setInviteMessage('');
      setInviteEmail('');
      setEmailTouched(false);
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
  }, [selectedResearcher, manuscriptId, inviteRole, inviteMessage, inviteEmail, collaborators, onCollaboratorsChange]);

  const handleRemoveCollaborator = useCallback((collaboratorId) => {
    const updatedCollaborators = collaborators.filter(c => c.id !== collaboratorId);
    onCollaboratorsChange(updatedCollaborators);
  }, [collaborators, onCollaboratorsChange]);


  return (
    <Box sx={{ p: embedded ? 0 : 3 }}>
      {!embedded && (
        <>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Invite Collaborators
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Search for researchers by name, then enter their institution email. The invitation is sent to that address, and also appears in their HospitiumRIS account if they already have one. Personal emails such as Gmail are not allowed.
          </Typography>
        </>
      )}

      <Stack spacing={embedded ? 3 : 2.5}>
        {!readOnly && (
          <Box>
            <Button
              variant={embedded ? 'outlined' : 'contained'}
              startIcon={<PersonAddIcon />}
              onClick={() => setSearchOpen(true)}
              sx={{
                ...(embedded
                  ? {
                      borderColor: '#8b6cbc',
                      color: '#8b6cbc',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 2.5,
                      py: 1,
                      '&:hover': {
                        borderColor: '#7b5ca7',
                        bgcolor: 'rgba(139, 108, 188, 0.06)'
                      }
                    }
                  : {
                      bgcolor: '#8b6cbc',
                      '&:hover': { bgcolor: '#7b5ca7' }
                    })
              }}
            >
              Add Collaborator
            </Button>
          </Box>
        )}

        {collaborators.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: embedded ? 4.5 : 4,
            px: embedded ? 3.5 : 4,
            textAlign: 'center',
            backgroundColor: '#fafbfd',
            border: '1px dashed rgba(139, 108, 188, 0.25)',
            borderRadius: 2,
            minHeight: embedded ? 168 : undefined
          }}
        >
          <GroupsIcon sx={{ fontSize: embedded ? 44 : 48, color: '#cbd5e0', mb: 2 }} />
          <Typography variant="subtitle1" sx={{ color: '#718096', mb: 1, fontWeight: 600, fontSize: embedded ? '0.95rem' : '1.1rem' }}>
            No collaborators yet
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '0.813rem',
              lineHeight: 1.6,
              maxWidth: 360,
              mx: 'auto'
            }}
          >
            {readOnly 
              ? 'No collaborators have been added to this manuscript'
              : 'Add co-authors now, or skip and invite them later from the editor'
            }
          </Typography>
        </Paper>
      ) : (
        <List sx={{ bgcolor: '#fafbfd', borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)' }}>
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
                      {collaborator.email && (
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                          <EmailIcon sx={{ fontSize: 14 }} />
                          {collaborator.email}
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
                  primaryTypographyProps={{ component: 'div' }}
                  secondaryTypographyProps={{ component: 'div' }}
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
      </Stack>

      {/* Search Dialog */}
      <Dialog
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSelectedResearcher(null);
          setInviteEmail('');
          setEmailTouched(false);
        }}
        maxWidth="sm"
        fullWidth
        disableScrollLock
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
            border: '1px solid rgba(139, 108, 188, 0.08)',
            overflow: 'hidden',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            px: 3,
            py: 2.25,
            background: 'linear-gradient(135deg, #8b6cbc 0%, #7b5ca7 100%)',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                flexShrink: 0
              }}>
                {selectedResearcher ? (
                  <PersonAddIcon sx={{ fontSize: 22 }} />
                ) : (
                  <SearchIcon sx={{ fontSize: 22 }} />
                )}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.0625rem', lineHeight: 1.3 }}>
                  {selectedResearcher ? 'Send Invitation' : 'Find ORCID Profile'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85, fontSize: '0.8125rem', mt: 0.25 }}>
                  {selectedResearcher
                    ? 'Enter their institution email and role'
                    : 'Search by given name and family name'}
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => {
                setSearchOpen(false);
                setSelectedResearcher(null);
                setInviteEmail('');
                setEmailTouched(false);
              }}
              size="small"
              sx={{ color: 'white', opacity: 0.9, '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' } }}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 3,
            pt: 3,
            pb: 3,
            flex: 1,
            overflow: 'auto',
            '&.MuiDialogContent-root': { pt: 3 }
          }}
        >
          {selectedResearcher ? (
            <Stack spacing={3}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  borderColor: alpha('#8b6cbc', 0.35),
                  bgcolor: alpha('#8b6cbc', 0.04)
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#8b6cbc', width: 40, height: 40, fontSize: '0.95rem', fontWeight: 600 }}>
                    {selectedResearcher.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9375rem', mb: 0.25 }}>
                      {selectedResearcher.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                      <LinkIcon sx={{ fontSize: 14 }} />
                      {selectedResearcher.orcidId}
                    </Typography>
                    {selectedResearcher.affiliations?.length > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                        <BusinessIcon sx={{ fontSize: 14, mt: 0.15 }} />
                        {selectedResearcher.affiliations.join(', ')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>

              <TextField
                fullWidth
                required
                type="email"
                label={t('manuscript_invite.email_label', 'Institution Email')}
                placeholder={t('manuscript_invite.email_placeholder', 'name@university.edu')}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onBlur={() => setEmailTouched(true)}
                error={emailTouched && !!emailError}
                helperText={
                  emailTouched && emailError
                    ? emailError
                    : t(
                        'manuscript_invite.email_helper',
                        'Invitation is emailed here. If they have an account they will also be notified in-app. Personal providers such as Gmail, Yahoo, and Outlook are not allowed.'
                      )
                }
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: alpha('#8b6cbc', 0.8), fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />

              <FormControl fullWidth sx={fieldSx}>
                <InputLabel>Collaboration Role</InputLabel>
                <Select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  label="Collaboration Role"
                >
                  {COLLABORATOR_ROLES.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{role.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                minRows={2}
                label={t('common.message_optional', 'Personal Message (Optional)')}
                placeholder="Add a personal note to your invitation..."
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                sx={fieldSx}
              />
            </Stack>
          ) : (
            <Stack spacing={3}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.8125rem', lineHeight: 1.65, maxWidth: 520 }}
              >
                Enter the researcher&apos;s name as it appears on their ORCID profile, then select them from the results.
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: '1px solid rgba(139, 108, 188, 0.12)',
                  bgcolor: '#fafbfd'
                }}
              >
                <Stack spacing={2.5}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Given Names"
                        name="givenNames"
                        value={orcidSearchData.givenNames}
                        onChange={handleOrcidInputChange}
                        fullWidth
                        placeholder="e.g. John, Maria"
                        sx={fieldSx}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && orcidSearchData.givenNames && orcidSearchData.familyName) {
                            e.preventDefault();
                            handleOrcidSearch();
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Family Name"
                        name="familyName"
                        value={orcidSearchData.familyName}
                        onChange={handleOrcidInputChange}
                        fullWidth
                        placeholder="e.g. Smith, García"
                        sx={fieldSx}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && orcidSearchData.givenNames && orcidSearchData.familyName) {
                            e.preventDefault();
                            handleOrcidSearch();
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, pt: 0.5 }}>
                    <Button
                      variant="contained"
                      onClick={handleOrcidSearch}
                      disabled={orcidLoading || !orcidSearchData.givenNames || !orcidSearchData.familyName}
                      startIcon={orcidLoading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 2.75,
                        py: 1,
                        bgcolor: '#8b6cbc',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#7b5ca7', boxShadow: '0 4px 14px rgba(139, 108, 188, 0.35)' },
                        '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
                      }}
                    >
                      Search ORCID
                    </Button>
                    {(orcidResults.length > 0 || hasSearchedOrcid) && (
                      <Button
                        variant="outlined"
                        onClick={clearSearch}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          borderRadius: 2,
                          px: 2.5,
                          py: 1,
                          borderColor: alpha('#8b6cbc', 0.4),
                          color: '#8b6cbc',
                          '&:hover': { borderColor: '#8b6cbc', bgcolor: alpha('#8b6cbc', 0.06) }
                        }}
                      >
                        {t('common.clear', 'Clear')}
                      </Button>
                    )}
                  </Box>
                </Stack>
              </Paper>

              {orcidError && (
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  {orcidError}
                </Alert>
              )}

              {orcidResults.length > 0 && (
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: 'rgba(0,0,0,0.08)',
                    maxHeight: 280,
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="caption" sx={{ display: 'block', px: 2.5, pt: 2, pb: 1, color: '#8b6cbc', fontWeight: 600, letterSpacing: '0.02em' }}>
                    {orcidResults.length} result{orcidResults.length !== 1 ? 's' : ''} found
                  </Typography>
                  <List dense disablePadding>
                    {orcidResults.map((result) => (
                      <ListItem
                        key={result.orcidId}
                        divider
                        component="div"
                        onClick={() => handleResearcherSelect(result)}
                        sx={{
                          py: 1.5,
                          px: 2,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: alpha('#8b6cbc', 0.06) }
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 44 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: '#8b6cbc', fontSize: '0.8rem' }}>
                            {result.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {result.displayName}
                            </Typography>
                          }
                          secondary={
                            <Box component="span" sx={{ display: 'block' }}>
                              <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block' }}>
                                ORCID: {result.orcidId}
                              </Typography>
                              {result.affiliations.length > 0 && (
                                <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.25 }}>
                                  {result.affiliations.join(', ')}
                                </Typography>
                              )}
                            </Box>
                          }
                          primaryTypographyProps={{ component: 'div' }}
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {orcidResults.length === 0 && hasSearchedOrcid && !orcidLoading && orcidSearchData.givenNames && orcidSearchData.familyName && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No ORCID profiles found. Try different spelling or name variants.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            gap: 1.5,
            borderTop: '1px solid rgba(0,0,0,0.06)',
            bgcolor: '#fafbfd',
            justifyContent: 'flex-end'
          }}
        >
          {!selectedResearcher ? (
            <Button
              onClick={() => {
                setSearchOpen(false);
                setSelectedResearcher(null);
                setInviteEmail('');
                setEmailTouched(false);
              }}
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                px: 2.5,
                borderColor: alpha('#8b6cbc', 0.35),
                color: '#64748b',
                '&:hover': { borderColor: alpha('#8b6cbc', 0.5), bgcolor: 'rgba(139, 108, 188, 0.04)' }
              }}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  setSearchOpen(false);
                  setSelectedResearcher(null);
                  setInviteEmail('');
                  setEmailTouched(false);
                }}
                sx={{
                  mr: 'auto',
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 1.5
                }}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={() => {
                  setSelectedResearcher(null);
                  setInviteEmail('');
                  setEmailTouched(false);
                }}
                variant="outlined"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2.5,
                  borderColor: alpha('#8b6cbc', 0.4),
                  color: '#8b6cbc',
                  '&:hover': { borderColor: '#8b6cbc', bgcolor: alpha('#8b6cbc', 0.06) }
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                startIcon={isInviting ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 18 }} />}
                onClick={handleInviteCollaborator}
                disabled={isInviting || !!emailError}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2.75,
                  bgcolor: '#8b6cbc',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#7b5ca7', boxShadow: '0 4px 14px rgba(139, 108, 188, 0.35)' },
                  '&:disabled': { bgcolor: '#e2e8f0', color: '#94a3b8' }
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
