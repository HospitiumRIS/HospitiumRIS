'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { getInstitutionalEmailError, normalizeEmail } from '../../../../../../lib/institutional-email';

const PURPLE = '#8b6cbc';
const fieldFocusSx = {
  '& .MuiOutlinedInput-root:hover fieldset': { borderColor: PURPLE },
  '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: PURPLE },
  '& .MuiInputLabel-root.Mui-focused': { color: PURPLE },
};

function displayName(researcher) {
  return researcher.creditName
    || `${researcher.givenNames || researcher.givenName || ''} ${researcher.familyName || ''}`.trim()
    || 'Unnamed researcher';
}

function ResearcherSummary({ researcher }) {
  const name = displayName(researcher);
  const legalName = `${researcher.givenNames || ''} ${researcher.familyName || ''}`.trim();
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(PURPLE, 0.28),
        bgcolor: alpha(PURPLE, 0.04),
        display: 'flex',
        gap: 1.25,
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          bgcolor: alpha(PURPLE, 0.12),
          color: PURPLE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <PersonIcon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
          {name}
        </Typography>
        {legalName && legalName !== name ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {legalName}
          </Typography>
        ) : null}
        {researcher.employmentSummary && researcher.employmentSummary !== 'Researcher' ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {researcher.employmentSummary}
          </Typography>
        ) : null}
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
          {researcher.orcidId ? (
            <Chip
              size="small"
              label={researcher.orcidId}
              sx={{ height: 22, fontWeight: 700, fontSize: '0.68rem', bgcolor: alpha(PURPLE, 0.1), color: PURPLE }}
            />
          ) : null}
          {(researcher.affiliations || []).slice(0, 2).map((affiliation) => (
            <Chip key={affiliation} size="small" label={affiliation} sx={{ height: 22, maxWidth: 220, fontSize: '0.68rem' }} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

export default function OrcidSearchModal({
  open,
  onClose,
  onSelect,
  title = 'Search ORCID',
  subtitle = 'Find a researcher by name or ORCID iD.',
  requireInvite = false,
  roleLabel = 'investigator',
  currentOrcid = '',
  allowMultiple = false,
  excludeOrcidIds = [],
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState('search');
  const [givenNames, setGivenNames] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [addedPeople, setAddedPeople] = useState([]);

  const canSearch = Boolean(givenNames.trim() || familyName.trim() || orcidId.trim());
  const emailError = getInstitutionalEmailError(inviteEmail);
  const isInviteStep = step === 'invite' && selected;
  const takenOrcids = new Set([
    ...excludeOrcidIds.filter(Boolean),
    ...addedPeople.map((person) => person.orcidId).filter(Boolean),
  ]);

  const resetSearchFields = () => {
    setGivenNames('');
    setFamilyName('');
    setOrcidId('');
    setSearchResults([]);
    setSelected(null);
    setInviteEmail('');
    setDepartment('');
    setEmailTouched(false);
    setError('');
    setHasSearched(false);
    setLoading(false);
    setStep('search');
  };

  const reset = () => {
    resetSearchFields();
    setAddedPeople([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const finishSelect = (researcher, email = '') => {
    if (researcher.orcidId && takenOrcids.has(researcher.orcidId)) {
      setError('This researcher is already added.');
      setStep('search');
      return;
    }
    onSelect({
      ...researcher,
      email: email || null,
      department: department.trim(),
    });
    if (!allowMultiple) {
      handleClose();
      return;
    }
    setAddedPeople((prev) => [
      ...prev,
      {
        name: displayName(researcher),
        orcidId: researcher.orcidId,
        email: email || '',
      },
    ]);
    resetSearchFields();
  };

  const handlePickResearcher = (researcher) => {
    if (researcher.orcidId && takenOrcids.has(researcher.orcidId)) {
      setError('This researcher is already added.');
      return;
    }
    const isCurrentUser = currentOrcid && researcher.orcidId === currentOrcid;
    if (requireInvite && !isCurrentUser) {
      setSelected(researcher);
      setInviteEmail('');
      setDepartment('');
      setEmailTouched(false);
      setError('');
      setStep('invite');
      return;
    }
    finishSelect(researcher);
  };

  const handleConfirmInvite = () => {
    setEmailTouched(true);
    if (emailError) return;
    finishSelect(selected, normalizeEmail(inviteEmail));
  };

  const handleSearch = async () => {
    if (!canSearch) {
      setError('Enter a given name, family name, or ORCID iD.');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const params = new URLSearchParams();
      const orcid = orcidId.trim();
      if (orcid) {
        params.append('q', orcid);
      } else {
        if (givenNames.trim()) params.append('givenNames', givenNames.trim());
        if (familyName.trim()) params.append('familyName', familyName.trim());
      }

      const response = await fetch(`/api/orcid/search?${params.toString()}`);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to search ORCID.');
      }
      setSearchResults(data.researchers || []);
    } catch (err) {
      console.error('ORCID Search Error:', err);
      setError(err.message || 'Failed to search ORCID. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (isInviteStep) handleConfirmInvite();
      else handleSearch();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableScrollLock
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '86vh' } }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.75,
          px: 2.5,
          mb: 0,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.25 }}>
            {isInviteStep ? `Invite ${roleLabel}` : title}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.88)' }}>
            {isInviteStep
              ? 'Add an institution email so they can be invited when you submit.'
              : allowMultiple
                ? 'Add one person, then search again. Click Done when you are finished.'
                : subtitle}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.16)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: '24px !important', pb: 1 }}>
        {isInviteStep ? (
          <Stack spacing={2}>
            <ResearcherSummary researcher={selected} />
            <TextField
              label="Department (optional)"
              placeholder="e.g. Cardiology"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              onKeyDown={handleKeyDown}
              InputLabelProps={{ shrink: true }}
              sx={fieldFocusSx}
            />
            <TextField
              autoFocus
              required
              type="email"
              label="Institution email"
              placeholder="name@university.edu"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              onKeyDown={handleKeyDown}
              error={emailTouched && Boolean(emailError)}
              helperText={
                emailTouched && emailError
                  ? emailError
                  : 'Invitation is sent here when you submit the proposal. Personal providers such as Gmail, Yahoo, and Outlook are not allowed.'
              }
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: PURPLE, fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={fieldFocusSx}
            />
          </Stack>
        ) : (
          <Stack spacing={2}>
            {addedPeople.length > 0 ? (
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 0.75 }}>
                  Added in this session ({addedPeople.length})
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {addedPeople.map((person) => (
                    <Chip
                      key={person.orcidId || person.email || person.name}
                      size="small"
                      label={person.name}
                      sx={{ fontWeight: 600, bgcolor: alpha(PURPLE, 0.1), color: PURPLE }}
                    />
                  ))}
                </Stack>
              </Box>
            ) : null}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1.5,
              }}
            >
              <TextField
                autoFocus
                label="Given name"
                placeholder="First name"
                value={givenNames}
                onChange={(e) => setGivenNames(e.target.value)}
                onKeyDown={handleKeyDown}
                InputLabelProps={{ shrink: true }}
                sx={fieldFocusSx}
              />
              <TextField
                label="Family name"
                placeholder="Last name"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                onKeyDown={handleKeyDown}
                InputLabelProps={{ shrink: true }}
                sx={fieldFocusSx}
              />
            </Box>
            <TextField
              label="ORCID iD (optional)"
              placeholder="0000-0000-0000-0000"
              value={orcidId}
              onChange={(e) => setOrcidId(e.target.value)}
              onKeyDown={handleKeyDown}
              helperText="Use this if you already know the researcher ORCID iD"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box
                      sx={{
                        bgcolor: PURPLE,
                        color: 'white',
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.75,
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 0.4,
                      }}
                    >
                      ORCID
                    </Box>
                  </InputAdornment>
                ),
              }}
              sx={fieldFocusSx}
            />

            {error ? <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert> : null}

            {loading ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <CircularProgress sx={{ color: PURPLE, mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary">
                  Searching ORCID...
                </Typography>
              </Box>
            ) : null}

            {hasSearched && !loading ? (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 1.25 }}>
                  {searchResults.length === 1 ? '1 result' : `${searchResults.length} results`}
                </Typography>
                {searchResults.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 5, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                    <PersonIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
                      No researchers found
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Try a fuller name or search with an ORCID iD.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={1} sx={{ maxHeight: 340, overflow: 'auto', pr: 0.5 }}>
                    {searchResults.map((researcher) => {
                      const name = displayName(researcher);
                      const legalName = `${researcher.givenNames || ''} ${researcher.familyName || ''}`.trim();
                      const isCurrentUser = currentOrcid && researcher.orcidId === currentOrcid;
                      const alreadyAdded = researcher.orcidId && takenOrcids.has(researcher.orcidId);
                      return (
                        <Box
                          key={researcher.orcidId}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 1.25,
                            '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.04) },
                          }}
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: 1.5,
                              bgcolor: alpha(PURPLE, 0.1),
                              color: PURPLE,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <PersonIcon sx={{ fontSize: 20 }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                              {name}
                            </Typography>
                            {legalName && legalName !== name ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {legalName}
                              </Typography>
                            ) : null}
                            {researcher.employmentSummary && researcher.employmentSummary !== 'Researcher' ? (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {researcher.employmentSummary}
                              </Typography>
                            ) : null}
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
                              <Chip
                                size="small"
                                label={researcher.orcidId}
                                sx={{ height: 22, fontWeight: 700, fontSize: '0.68rem', bgcolor: alpha(PURPLE, 0.1), color: PURPLE }}
                              />
                              {(researcher.affiliations || []).slice(0, 2).map((affiliation) => (
                                <Chip
                                  key={affiliation}
                                  size="small"
                                  label={affiliation}
                                  sx={{ height: 22, maxWidth: 220, fontSize: '0.68rem' }}
                                />
                              ))}
                            </Stack>
                          </Box>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={alreadyAdded}
                            onClick={() => handlePickResearcher(researcher)}
                            sx={{
                              bgcolor: PURPLE,
                              textTransform: 'none',
                              fontWeight: 700,
                              flexShrink: 0,
                              '&:hover': { bgcolor: '#7a5aad' },
                            }}
                          >
                            {alreadyAdded ? 'Added' : requireInvite && !isCurrentUser ? 'Continue' : 'Select'}
                          </Button>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            ) : null}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#faf8fc', justifyContent: 'space-between' }}>
        {isInviteStep ? (
          <Button
            startIcon={<BackIcon />}
            onClick={() => setStep('search')}
            sx={{ textTransform: 'none', color: PURPLE, fontWeight: 600 }}
          >
            Back to results
          </Button>
        ) : (
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
            {allowMultiple && addedPeople.length > 0
              ? t('common.done', 'Done')
              : t('common.cancel', 'Cancel')}
          </Button>
        )}
        {isInviteStep ? (
          <Button
            variant="contained"
            startIcon={<EmailIcon />}
            onClick={handleConfirmInvite}
            disabled={Boolean(emailError)}
            sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#7a5aad' } }}
          >
            {allowMultiple ? 'Add and search again' : 'Add and invite'}
          </Button>
        ) : (
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            onClick={handleSearch}
            disabled={loading || !canSearch}
            sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#7a5aad' } }}
          >
            {loading ? 'Searching...' : 'Search ORCID'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
