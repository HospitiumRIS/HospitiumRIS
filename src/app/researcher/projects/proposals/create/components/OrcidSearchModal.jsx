'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Business as InstitutionIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { getInstitutionalEmailError, normalizeEmail } from '../../../../../../lib/institutional-email';
import InstitutionDirectoryModal from './InstitutionDirectoryModal';
import ResearcherProfileModal from './ResearcherProfileModal';
import {
  HospitiumBadge,
  PURPLE,
  PURPLE_DARK,
  ResearcherAvatar,
  canViewProfile,
  displayName,
  fieldFocusSx,
  orcidKey,
  outlinedButtonSx,
} from './researcherDisplay';

const MODE_DIRECTORY = 'directory';
const MODE_ORCID = 'orcid';
const QUICK_RESULTS = 5;

function ResearcherDetails({ researcher, showAffiliations = true }) {
  const name = displayName(researcher);
  const legalName = `${researcher.givenNames || ''} ${researcher.familyName || ''}`.trim();
  const fromDirectory = researcher.hospitium?.sameInstitution;
  return (
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
      {fromDirectory && (researcher.hospitium.department || researcher.hospitium.email) ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {[researcher.hospitium.department, researcher.hospitium.email].filter(Boolean).join(' · ')}
        </Typography>
      ) : null}
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 0.75 }}>
        <HospitiumBadge hospitium={researcher.hospitium} />
        {researcher.orcidId ? (
          <Chip
            size="small"
            label={researcher.orcidId}
            sx={{ height: 22, fontWeight: 700, fontSize: '0.68rem', bgcolor: alpha(PURPLE, 0.1), color: PURPLE }}
          />
        ) : null}
        {showAffiliations && !fromDirectory
          ? (researcher.affiliations || []).slice(0, 2).map((affiliation) => (
            <Chip key={affiliation} size="small" label={affiliation} sx={{ height: 22, maxWidth: 220, fontSize: '0.68rem' }} />
          ))
          : null}
      </Stack>
    </Box>
  );
}

function ResearcherSummary({ researcher }) {
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
      <ResearcherAvatar researcher={researcher} />
      <ResearcherDetails researcher={researcher} />
    </Box>
  );
}

function ResultRow({ researcher, actionLabel, disabled, onPick, onView }) {
  return (
    <Box
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
      <ResearcherAvatar researcher={researcher} />
      <ResearcherDetails researcher={researcher} />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ flexShrink: 0 }}>
        {onView && canViewProfile(researcher) ? (
          <Button size="small" variant="outlined" onClick={() => onView(researcher)} sx={outlinedButtonSx}>
            Profile
          </Button>
        ) : null}
        <Button
          size="small"
          variant="contained"
          disabled={disabled}
          onClick={() => onPick(researcher)}
          sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: PURPLE_DARK } }}
        >
          {actionLabel}
        </Button>
      </Stack>
    </Box>
  );
}

function EmptyState({ title, hint }) {
  return (
    <Box sx={{ textAlign: 'center', py: 4, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
      <PersonIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
      <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>
        {title}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
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
  excludeEmails = [],
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState(MODE_ORCID);
  const [step, setStep] = useState('search');

  // ORCID search
  const [givenNames, setGivenNames] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Institution directory
  const [directoryMeta, setDirectoryMeta] = useState(null); // { linked, institution, directoryTotal }
  const [directoryQuery, setDirectoryQuery] = useState('');
  const [directoryResults, setDirectoryResults] = useState([]);
  const [directoryTotal, setDirectoryTotal] = useState(0);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [profileUserId, setProfileUserId] = useState(null);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState('');
  const directoryRequestRef = useRef(null);

  // Invite step
  const [selected, setSelected] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  const [error, setError] = useState('');
  const [addedPeople, setAddedPeople] = useState([]);

  const institutionName = directoryMeta?.institution?.name || '';
  const directoryLinked = directoryMeta ? Boolean(directoryMeta.linked) : true;
  const directoryTabLabel = institutionName ? `${institutionName} Directory` : 'Institution Directory';

  const canSearch = Boolean(givenNames.trim() || familyName.trim() || orcidId.trim());
  const registeredEmail = selected?.hospitium?.sameInstitution ? normalizeEmail(selected.hospitium.email || '') : '';
  // A colleague's verified Hospitium account email is trusted even if the
  // institution was verified manually and the address is on a personal domain.
  const emailError = registeredEmail && normalizeEmail(inviteEmail) === registeredEmail
    ? ''
    : getInstitutionalEmailError(inviteEmail);
  const isInviteStep = step === 'invite' && selected;

  const takenOrcids = new Set([
    ...excludeOrcidIds.filter(Boolean).map(orcidKey),
    ...addedPeople.map((person) => orcidKey(person.orcidId)).filter(Boolean),
  ]);
  const takenEmails = new Set([
    ...excludeEmails.filter(Boolean).map(normalizeEmail),
    ...addedPeople.map((person) => normalizeEmail(person.email)).filter(Boolean),
  ]);

  const isTaken = (researcher) => {
    if (researcher.orcidId && takenOrcids.has(orcidKey(researcher.orcidId))) return true;
    const knownEmail = normalizeEmail(researcher.hospitium?.sameInstitution ? researcher.hospitium.email : '');
    return Boolean(knownEmail && takenEmails.has(knownEmail));
  };

  // ---- Institution directory loading -------------------------------------------------
  const loadDirectory = useCallback(async (query) => {
    if (directoryRequestRef.current) directoryRequestRef.current.abort();
    const controller = new AbortController();
    directoryRequestRef.current = controller;

    setDirectoryLoading(true);
    setDirectoryError('');
    try {
      const params = new URLSearchParams({ pageSize: String(QUICK_RESULTS) });
      if (query.trim()) params.append('q', query.trim());
      const response = await fetch(`/api/researcher/institution-directory?${params.toString()}`, {
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to load the institution directory.');

      setDirectoryMeta({ linked: data.linked, institution: data.institution, directoryTotal: data.directoryTotal || 0 });
      setDirectoryResults(data.researchers || []);
      setDirectoryTotal(data.total || 0);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Institution directory error:', err);
      setDirectoryError(err.message || 'Failed to load the institution directory.');
      setDirectoryResults([]);
    } finally {
      if (directoryRequestRef.current === controller) {
        directoryRequestRef.current = null;
        setDirectoryLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!open || step !== 'search') return undefined;
    if (mode !== MODE_DIRECTORY && directoryMeta) return undefined;
    if (directoryMeta && !directoryMeta.linked) return undefined;
    const timer = setTimeout(() => loadDirectory(directoryQuery), directoryQuery ? 300 : 0);
    return () => clearTimeout(timer);
    // directoryMeta intentionally omitted: it is the result of this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, step, directoryQuery, loadDirectory]);

  useEffect(() => () => directoryRequestRef.current?.abort(), []);

  // ---- Reset / close -----------------------------------------------------------------
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
    setDirectoryQuery('');
    setDirectoryError('');
    setBrowseOpen(false);
    setProfileUserId(null);
    setMode(MODE_ORCID);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleModeChange = (_event, value) => {
    setMode(value);
    setError('');
  };

  // ---- Selection ---------------------------------------------------------------------
  const finishSelect = (researcher, email = '') => {
    if (isTaken(researcher) || (email && takenEmails.has(normalizeEmail(email)))) {
      setError('This researcher is already added.');
      setStep('search');
      return;
    }
    const colleague = researcher.hospitium?.sameInstitution ? researcher.hospitium : null;
    onSelect({
      ...researcher,
      userId: colleague?.userId || researcher.userId || null,
      institution: colleague?.institution || researcher.institution || '',
      registeredOnHospitium: Boolean(researcher.hospitium?.registered),
      email: email || null,
      department: department.trim(),
    });
    if (!allowMultiple) {
      handleClose();
      return;
    }
    setAddedPeople((prev) => [
      ...prev,
      { name: displayName(researcher), orcidId: researcher.orcidId, email: email || '' },
    ]);
    resetSearchFields();
  };

  const handlePickResearcher = (researcher) => {
    if (isTaken(researcher)) {
      setError('This researcher is already added.');
      return;
    }
    const isCurrentUser = Boolean(
      (currentOrcid && orcidKey(researcher.orcidId) === orcidKey(currentOrcid)) || researcher.hospitium?.isCurrentUser,
    );
    if (requireInvite && !isCurrentUser) {
      const colleague = researcher.hospitium?.sameInstitution ? researcher.hospitium : null;
      setSelected(researcher);
      setInviteEmail(colleague?.email || '');
      setDepartment(colleague?.department || '');
      setEmailTouched(Boolean(colleague?.email));
      setError('');
      setStep('invite');
      return;
    }
    finishSelect(researcher);
  };

  const handleViewProfile = (researcher) => {
    const userId = researcher.hospitium?.userId || researcher.userId;
    if (userId) setProfileUserId(userId);
  };

  // Add from the full directory or the profile summary: close those layers and
  // continue in this modal's confirmation step.
  const handleAddFromLayer = (researcher) => {
    setProfileUserId(null);
    setBrowseOpen(false);
    handlePickResearcher(researcher);
  };

  const handleConfirmInvite = () => {
    setEmailTouched(true);
    if (emailError) return;
    finishSelect(selected, normalizeEmail(inviteEmail));
  };

  // ---- ORCID search ------------------------------------------------------------------
  const attachHospitiumMatches = async (researchers) => {
    const orcids = researchers.map((r) => orcidKey(r.orcidId)).filter(Boolean);
    if (!orcids.length) return researchers;
    try {
      const response = await fetch(`/api/researcher/institution-directory/match?orcids=${encodeURIComponent(orcids.join(','))}`);
      const data = await response.json();
      if (!response.ok || !data.success) return researchers;
      const matches = data.matches || {};
      const enriched = researchers.map((r) => ({ ...r, hospitium: matches[orcidKey(r.orcidId)] || null }));
      // Colleagues first, then other registered users, then everyone else
      const rank = (r) => (r.hospitium?.sameInstitution ? 0 : r.hospitium?.registered ? 1 : 2);
      return enriched.sort((a, b) => rank(a) - rank(b));
    } catch (err) {
      console.warn('Hospitium match lookup failed:', err);
      return researchers;
    }
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
      setSearchResults(await attachHospitiumMatches(data.researchers || []));
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
      else if (mode === MODE_ORCID) handleSearch();
    }
  };

  const actionLabelFor = (researcher) => {
    if (isTaken(researcher)) return 'Added';
    const isCurrentUser = (currentOrcid && orcidKey(researcher.orcidId) === orcidKey(currentOrcid)) || researcher.hospitium?.isCurrentUser;
    return requireInvite && !isCurrentUser ? 'Continue' : 'Select';
  };

  // ---- Render pieces -----------------------------------------------------------------
  const renderInviteStep = () => {
    const colleague = selected.hospitium?.sameInstitution ? selected.hospitium : null;
    const usingRegisteredEmail = Boolean(registeredEmail) && normalizeEmail(inviteEmail) === registeredEmail;
    return (
      <Stack spacing={2}>
        <ResearcherSummary researcher={selected} />
        {colleague ? (
          <Alert severity="success" icon={<VerifiedIcon fontSize="inherit" />} sx={{ borderRadius: 2 }}>
            Registered at {colleague.institution || 'your institution'} on Hospitium. Department and email were
            filled from their profile. You can change them if needed.
          </Alert>
        ) : selected.hospitium?.registered && !selected.hospitium?.isCurrentUser ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            This researcher is on Hospitium at another institution. Enter their institution email to invite them.
          </Alert>
        ) : null}
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
          autoFocus={!colleague}
          required
          type="email"
          name="investigator-invite-email"
          autoComplete="off"
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
              : usingRegisteredEmail
                ? 'Their Hospitium account email. The invitation is sent here when you submit the proposal.'
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
    );
  };

  const renderDirectory = () => {
    if (directoryMeta && !directoryMeta.linked) {
      return (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Your account is not linked to a verified institution yet, so there is no directory to search. Use the
          ORCID tab instead.
        </Alert>
      );
    }
    const memberCount = directoryMeta?.directoryTotal || 0;
    const filtered = Boolean(directoryQuery.trim());
    return (
      <Stack spacing={2}>
        <TextField
          autoFocus
          label="Quick search"
          placeholder="Name, email, ORCID iD or department"
          value={directoryQuery}
          onChange={(e) => setDirectoryQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          InputLabelProps={{ shrink: true }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: PURPLE, fontSize: 20 }} />
              </InputAdornment>
            ),
            endAdornment: directoryLoading ? (
              <InputAdornment position="end">
                <CircularProgress size={16} sx={{ color: PURPLE }} />
              </InputAdornment>
            ) : null,
          }}
          sx={fieldFocusSx}
        />

        <Box
          component="button"
          type="button"
          onClick={() => setBrowseOpen(true)}
          disabled={!directoryMeta}
          sx={{
            all: 'unset',
            boxSizing: 'border-box',
            cursor: directoryMeta ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 1.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha(PURPLE, 0.3),
            background: `linear-gradient(135deg, ${alpha(PURPLE, 0.1)} 0%, ${alpha(PURPLE, 0.03)} 100%)`,
            transition: 'border-color 120ms, box-shadow 120ms',
            '&:hover': { borderColor: PURPLE, boxShadow: `0 4px 14px ${alpha(PURPLE, 0.15)}` },
            '&:focus-visible': { outline: `2px solid ${PURPLE}`, outlineOffset: 2 },
          }}
        >
          <Box sx={{ width: 38, height: 38, borderRadius: 1.5, bgcolor: alpha(PURPLE, 0.16), color: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <InstitutionIcon fontSize="small" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e293b' }}>
              Browse full directory
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {directoryMeta
                ? `${memberCount.toLocaleString()} researcher${memberCount === 1 ? '' : 's'} · filter by department, sort, view profiles`
                : 'Loading directory...'}
            </Typography>
          </Box>
          <ChevronRightIcon sx={{ color: PURPLE }} />
        </Box>

        {error ? <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert> : null}
        {directoryError ? <Alert severity="error" sx={{ borderRadius: 2 }}>{directoryError}</Alert> : null}

        {directoryMeta ? (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', mb: 1.25 }}>
              {filtered
                ? directoryTotal > directoryResults.length
                  ? `Top ${directoryResults.length} of ${directoryTotal.toLocaleString()} matches`
                  : `${directoryTotal} match${directoryTotal === 1 ? '' : 'es'}`
                : 'Researchers'}
            </Typography>
            {!directoryLoading && directoryResults.length === 0 ? (
              <EmptyState
                title={filtered ? 'No colleagues match' : 'No other researchers registered yet'}
                hint={filtered
                  ? 'Try another spelling, browse the full directory, or search ORCID.'
                  : `Invite colleagues to join ${institutionName || 'your institution'} on Hospitium, or search ORCID.`}
              />
            ) : (
              <Stack spacing={1} sx={{ opacity: directoryLoading ? 0.6 : 1 }}>
                {directoryResults.map((researcher) => (
                  <ResultRow
                    key={researcher.userId}
                    researcher={researcher}
                    actionLabel={actionLabelFor(researcher)}
                    disabled={isTaken(researcher)}
                    onPick={handlePickResearcher}
                    onView={handleViewProfile}
                  />
                ))}
                {directoryTotal > directoryResults.length ? (
                  <Button
                    onClick={() => setBrowseOpen(true)}
                    endIcon={<ChevronRightIcon />}
                    sx={{ alignSelf: 'center', textTransform: 'none', fontWeight: 700, color: PURPLE }}
                  >
                    See all {directoryTotal.toLocaleString()} {filtered ? 'matches' : 'researchers'}
                  </Button>
                ) : null}
              </Stack>
            )}
          </Box>
        ) : null}
      </Stack>
    );
  };

  const renderOrcid = () => (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
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
        helperText="Researchers already registered at your institution are filled in automatically"
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
            <EmptyState title="No researchers found" hint="Try a fuller name or search with an ORCID iD." />
          ) : (
            <Stack spacing={1} sx={{ maxHeight: 340, overflow: 'auto', pr: 0.5 }}>
              {searchResults.map((researcher) => (
                <ResultRow
                  key={researcher.orcidId}
                  researcher={researcher}
                  actionLabel={actionLabelFor(researcher)}
                  disabled={isTaken(researcher)}
                  onPick={handlePickResearcher}
                  onView={handleViewProfile}
                />
              ))}
            </Stack>
          )}
        </Box>
      ) : null}
    </Stack>
  );

  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' || browseOpen || profileUserId) return;
        handleClose();
      }}
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
              ? 'Confirm their department and institution email so they can be invited when you submit.'
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

      {!isInviteStep ? (
        <Box sx={{ px: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs
            value={mode}
            onChange={handleModeChange}
            variant="scrollable"
            scrollButtons={false}
            sx={{
              minHeight: 46,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 46 },
              '& .Mui-selected': { color: `${PURPLE} !important` },
              '& .MuiTabs-indicator': { bgcolor: PURPLE },
            }}
          >
            <Tab
              value={MODE_ORCID}
              icon={(
                <Box component="span" sx={{ bgcolor: PURPLE, color: 'white', px: 0.6, borderRadius: 0.5, fontSize: 9, fontWeight: 800, lineHeight: '16px' }}>
                  iD
                </Box>
              )}
              iconPosition="start"
              label="ORCID"
            />
            <Tab
              value={MODE_DIRECTORY}
              icon={<InstitutionIcon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              label={directoryTabLabel}
              disabled={!directoryLinked}
            />
          </Tabs>
        </Box>
      ) : null}

      <DialogContent sx={{ px: 3, pt: '20px !important', pb: 1 }}>
        {isInviteStep ? (
          renderInviteStep()
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
            {mode === MODE_DIRECTORY ? renderDirectory() : renderOrcid()}
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
            sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: PURPLE_DARK } }}
          >
            {allowMultiple ? 'Add and search again' : 'Add and invite'}
          </Button>
        ) : mode === MODE_ORCID ? (
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            onClick={handleSearch}
            disabled={loading || !canSearch}
            sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: PURPLE_DARK } }}
          >
            {loading ? 'Searching...' : 'Search ORCID'}
          </Button>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Results update as you type
          </Typography>
        )}
      </DialogActions>

      <InstitutionDirectoryModal
        open={browseOpen}
        onClose={() => setBrowseOpen(false)}
        onView={handleViewProfile}
        onAdd={handleAddFromLayer}
        isTaken={isTaken}
        roleLabel={roleLabel}
        institutionName={institutionName}
        initialQuery={directoryQuery}
      />

      <ResearcherProfileModal
        open={Boolean(profileUserId)}
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onAdd={handleAddFromLayer}
        isTaken={isTaken}
        roleLabel={roleLabel}
      />
    </Dialog>
  );
}
