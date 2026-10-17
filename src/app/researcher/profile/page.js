'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  InputAdornment,
  Link as MuiLink,
  Skeleton,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Article as ArticleIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Cancel as CancelIcon,
  DeleteForever as DeleteForeverIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  LinkedIn as LinkedInIcon,
  LocationOn as LocationIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Public as WebIcon,
  Save as SaveIcon,
  School as SchoolIcon,
  Twitter as TwitterIcon,
  WarningAmber as WarningIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../components/AuthProvider';
import {
  InstitutionModal,
  InstitutionModalBody,
  InstitutionModalFooter,
  InstitutionModalHeader,
  InstitutionModalSection,
} from '../../../components/GlobalAdmin/InstitutionModalShell';
import {
  CitedByCard,
  PublicAccessCard,
  CoauthorsCard,
  PublicationsTable,
} from '../../../components/Researcher/ScholarMetrics';
import { ResearcherIdLinks, ResearcherIdsPanel } from '../../../components/Researcher/ResearcherIds';
import ProfilePhotoAvatar from '../../../components/Researcher/ProfilePhotoAvatar';
import ResearchExpertiseCard from '../../../components/Researcher/ResearchExpertiseCard';
import ChangePasswordButton from '../../../components/Researcher/ChangePasswordCard';

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';
const INK = '#0f172a';
const BODY = '#334155';
const MUTED = '#64748b';
const LINE = '#e2e8f0';
const SURFACE = '#f6f7fb';

const cardSx = { borderRadius: 2.5, border: `1px solid ${LINE}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04)', bgcolor: 'white' };
const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 1.5 } };

const ACADEMIC_TITLES = ['Prof.', 'Assoc. Prof.', 'Dr.', 'Mr.', 'Ms.', 'Mrs.', 'Mx.'];
const FOCUS_MAX = 300;
const BIO_MAX = 2000;
const SELF_DELETABLE = ['RESEARCHER', 'RESEARCH_ADMIN'];

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'experience', label: 'Experience & Education' },
  { key: 'ids', label: 'Researcher IDs' },
  { key: 'account', label: 'Account & security' },
];

const fmtNumber = (n) => (typeof n === 'number' ? n.toLocaleString() : '—');
const yearOf = (d) => d?.year?.value || null;

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function SectionHeading({ icon: Icon, title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        {Icon && (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: 'rgba(139,108,188,0.1)',
              color: PURPLE_DARK,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon sx={{ fontSize: 18 }} />
          </Box>
        )}
        <Box>
          <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.98rem', lineHeight: 1.4 }}>{title}</Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: MUTED }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {action}
    </Box>
  );
}

function FormSection({ icon, title, subtitle, children }) {
  return (
    <Box sx={{ border: `1px solid ${LINE}`, borderRadius: 2, p: { xs: 2, sm: 3 } }}>
      <SectionHeading icon={icon} title={title} subtitle={subtitle} />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>{children}</Box>
    </Box>
  );
}

function FromOrcidChip() {
  return (
    <Chip
      label="From ORCID"
      size="small"
      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: 'rgba(166,206,57,0.16)', color: '#4d6b0f' }}
    />
  );
}

function Stat({ label, value, hint }) {
  return (
    <Tooltip title={hint || ''} disableHoverListener={!hint}>
      <Box sx={{ px: { xs: 1.5, md: 2.5 }, py: 1, textAlign: 'center', minWidth: 88 }}>
        <Typography sx={{ fontWeight: 800, color: INK, fontSize: { xs: '1.2rem', md: '1.45rem' }, lineHeight: 1.2 }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: MUTED, fontWeight: 600, letterSpacing: '0.02em' }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function InfoRow({ icon: Icon, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: MUTED, minWidth: 0 }}>
      <Icon sx={{ fontSize: 16, color: '#94a3b8', flexShrink: 0 }} />
      <Typography variant="body2" noWrap sx={{ color: MUTED, fontSize: '0.84rem' }}>
        {children}
      </Typography>
    </Box>
  );
}

function Timeline({ items, titleKey, emptyIcon: EmptyIcon, emptyText }) {
  if (!items?.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, border: `1px dashed ${LINE}`, borderRadius: 2 }}>
        <EmptyIcon sx={{ fontSize: 36, color: '#cbd5e0', mb: 1 }} />
        <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.84rem' }}>
          {emptyText}
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ position: 'relative', pl: 3 }}>
      <Box sx={{ position: 'absolute', left: 6, top: 8, bottom: 8, width: 2, bgcolor: '#ede9f6', borderRadius: 1 }} />
      {items.map((item, index) => {
        const start = yearOf(item.startDate);
        const end = yearOf(item.endDate);
        return (
          <Box key={`${item.organization}-${index}`} sx={{ position: 'relative', pb: index < items.length - 1 ? 3 : 0 }}>
            <Box
              sx={{
                position: 'absolute',
                left: -23,
                top: 5,
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: end ? 'white' : PURPLE,
                border: `2px solid ${PURPLE}`,
              }}
            />
            <Typography sx={{ fontWeight: 600, color: INK, fontSize: '0.93rem' }}>{item[titleKey]}</Typography>
            <Typography sx={{ color: PURPLE_DARK, fontSize: '0.86rem', fontWeight: 500 }}>
              {item.organization}
              {item.department ? ` · ${item.department}` : ''}
            </Typography>
            <Typography variant="caption" sx={{ color: MUTED }}>
              {[start || end ? `${start || '—'} – ${end || 'Present'}` : null, item.location].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function ProfileSkeleton() {
  return (
    <Box sx={{ bgcolor: SURFACE, minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3, mb: 3 }} />
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3, mb: 3 }} />
            <Skeleton variant="rounded" height={420} sx={{ borderRadius: 3 }} />
          </Box>
          <Box sx={{ width: { xs: '100%', lg: 340 } }}>
            <Skeleton variant="rounded" height={160} sx={{ borderRadius: 3, mb: 3 }} />
            <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const ResearcherProfilePage = () => {
  const { user, isLoading: authLoading, updateUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [editedProfile, setEditedProfile] = useState(null);
  const [orcidData, setOrcidData] = useState(null);
  const [publications, setPublications] = useState([]); // ORCID + Hospitium published manuscripts
  const [worksMeta, setWorksMeta] = useState({
    hasOrcid: false,
    orcidError: null,
    counts: null,
    metrics: null,
    metricsError: null,
    metricsSource: 'OpenAlex',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ---- data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const [profileRes, worksRes] = await Promise.all([
          fetch('/api/researcher/profile', { credentials: 'include' }),
          fetch('/api/researcher/profile/works', { credentials: 'include' }),
        ]);
        if (!profileRes.ok) throw new Error('Failed to fetch profile data');

        const profileData = await profileRes.json();
        const worksData = worksRes.ok ? await worksRes.json() : { works: [] };

        setProfile(profileData.profile);
        setEditedProfile(profileData.profile);
        setOrcidData(profileData.orcidData);
        setPublications(worksData.works || []);
        setWorksMeta({
          hasOrcid: Boolean(worksData.hasOrcid),
          orcidError: worksData.orcidError || null,
          counts: worksData.counts || null,
          metrics: worksData.metrics || null,
          metricsError: worksData.metricsError || null,
          metricsSource: worksData.metricsSource || 'OpenAlex',
        });
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // only refetch when the signed-in user changes

  // auto-dismiss success banners
  useEffect(() => {
    if (!success) return undefined;
    const t = setTimeout(() => setSuccess(null), 4000);
    return () => clearTimeout(t);
  }, [success]);

  // ---- helpers
  const rp = profile?.researchProfile || {};
  const erp = editedProfile?.researchProfile || {};
  const metrics = worksMeta.metrics;

  const initials = useMemo(() => {
    const g = profile?.givenName?.[0] || '';
    const f = profile?.familyName?.[0] || '';
    return (g + f).toUpperCase() || 'U';
  }, [profile?.givenName, profile?.familyName]);

  const fullName = [rp.academicTitle, profile?.givenName, profile?.familyName].filter(Boolean).join(' ');
  const currentEmployment = orcidData?.employments?.find((e) => !e.endDate) || orcidData?.employments?.[0];
  const headline = currentEmployment?.role && currentEmployment.role !== 'Role not specified' ? currentEmployment.role : null;

  const patchProfile = (patch) => {
    const apply = (prev) => (prev ? { ...prev, ...patch(prev) } : prev);
    setProfile(apply);
    setEditedProfile(apply);
  };
  const patchResearchProfile = (fields) =>
    patchProfile((prev) => ({ researchProfile: { ...(prev.researchProfile || {}), ...fields } }));

  const handleFieldChange = (field, value) => setEditedProfile((prev) => ({ ...prev, [field]: value }));
  const handleResearchField = (field, value) =>
    setEditedProfile((prev) => ({ ...prev, researchProfile: { ...(prev.researchProfile || {}), [field]: value } }));

  // ---- actions
  const startEditing = () => {
    setEditedProfile(profile);
    setEditing(true);
    setActiveTab('overview');
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setEditing(false);
    setError(null);
  };

  const handleSaveProfile = async () => {
    if (!editedProfile?.givenName?.trim()) return;
    try {
      setSaving(true);
      setError(null);
      const response = await fetch('/api/researcher/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editedProfile),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      const data = await response.json();
      setProfile(data.profile);
      setEditedProfile(data.profile);
      setEditing(false);
      updateUser?.({ givenName: data.profile.givenName, familyName: data.profile.familyName });
      setSuccess('Profile updated');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = () => {
    setDeletePassword('');
    setDeleteConfirm('');
    setDeleteError('');
    setDeleteOpen(true);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE' || !deletePassword) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const response = await fetch('/api/researcher/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: deletePassword, confirm: 'DELETE' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setDeleteError(data.message || 'Failed to delete account');
        setDeleting(false);
        return;
      }
      window.location.href = '/login?accountDeleted=1'; // cookie cleared server-side
    } catch (err) {
      console.error('Error deleting account:', err);
      setDeleteError('Failed to delete account');
      setDeleting(false);
    }
  };

  // ---- render guards
  if (authLoading || loading) return <ProfileSkeleton />;

  if (error && !profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const biography = orcidData?.biography || rp.biography;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: SURFACE, pb: 6 }}>
      <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 4 } }}>
        {/* ================================================================
            HERO
           ================================================================ */}
        <Card sx={{ ...cardSx, overflow: 'hidden', mb: 3 }}>
          <Box
            sx={{
              height: { xs: 72, md: 96 },
              background: `linear-gradient(120deg, ${PURPLE_DARK} 0%, ${PURPLE} 55%, #b9a3db 100%)`,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              },
            }}
          />
          <Box sx={{ px: { xs: 2.5, md: 4 }, pb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'flex-start' },
                gap: { xs: 1.5, md: 3 },
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1, mt: { xs: -6, md: -7 }, flexShrink: 0 }}>
                <ProfilePhotoAvatar
                  avatarUrl={profile?.avatarUrl}
                  initials={initials}
                  size={112}
                  avatarSx={{ border: '4px solid white', boxShadow: '0 2px 8px rgba(15,23,42,0.12)' }}
                  onChange={(avatarUrl) => {
                    patchProfile(() => ({ avatarUrl }));
                    updateUser?.({ avatarUrl });
                    setSuccess(avatarUrl ? 'Profile photo updated' : 'Profile photo removed');
                  }}
                />
              </Box>

              <Box sx={{ flex: 1, minWidth: 0, pt: { xs: 0, md: 2 } }}>
                <Typography component="h1" sx={{ fontWeight: 800, color: INK, fontSize: { xs: '1.45rem', md: '1.75rem' }, lineHeight: 1.25 }}>
                  {fullName || 'Your name'}
                </Typography>
                <Typography sx={{ color: BODY, fontSize: '0.95rem', mt: 0.25 }}>
                  {[headline, rp.department].filter(Boolean).join(' · ') || 'Researcher'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.75, mt: 1 }}>
                  {profile?.primaryInstitution && <InfoRow icon={BusinessIcon}>{profile.primaryInstitution}</InfoRow>}
                  {currentEmployment?.location && <InfoRow icon={LocationIcon}>{currentEmployment.location}</InfoRow>}
                  {profile?.createdAt && (
                    <InfoRow icon={CalendarIcon}>
                      Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </InfoRow>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'stretch', md: 'flex-start' }, pt: { md: 2.5 } }}>
                {editing ? (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={handleCancelEdit}
                      disabled={saving}
                      sx={{ borderColor: '#cbd5e0', color: BODY, textTransform: 'none', fontWeight: 600, flex: { xs: 1, md: 'none' } }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveProfile}
                      disabled={saving || !editedProfile?.givenName?.trim()}
                      sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK }, textTransform: 'none', fontWeight: 600, flex: { xs: 1, md: 'none' } }}
                    >
                      {saving ? 'Saving…' : 'Save profile'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={startEditing}
                    sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK }, textTransform: 'none', fontWeight: 600, flex: { xs: 1, md: 'none' } }}
                  >
                    Edit profile
                  </Button>
                )}
              </Box>
            </Box>

            {/* identifiers */}
            {(profile?.orcidId || rp.researcherIds?.length > 0) && (
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
                {profile?.orcidId && (
                  <Chip
                    component="a"
                    href={`https://orcid.org/${profile.orcidId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    size="small"
                    label={`ORCID ${profile.orcidId}`}
                    sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, bgcolor: 'rgba(166,206,57,0.16)', color: '#4d6b0f', border: '1px solid rgba(166,206,57,0.35)' }}
                  />
                )}
                <ResearcherIdLinks ids={rp.researcherIds || []} />
              </Box>
            )}

            <Divider sx={{ my: 2.5 }} />

            {/* key metrics */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: { xs: 'space-between', md: 'flex-start' }, mx: { xs: -1.5, md: -2.5 } }}>
              <Stat label="Publications" value={fmtNumber(publications.length)} hint="ORCID works plus work published in Hospitium" />
              <Stat label="Citations" value={fmtNumber(metrics?.citedBy?.citations?.all)} hint={`Source: ${worksMeta.metricsSource}`} />
              <Stat label="h-index" value={fmtNumber(metrics?.citedBy?.hIndex?.all ?? rp.hIndex)} />
              <Stat label="i10-index" value={fmtNumber(metrics?.citedBy?.i10Index?.all)} />
              <Stat label="Co-authors" value={fmtNumber(metrics?.coauthors?.length)} hint="Top collaborators found in OpenAlex" />
            </Box>
          </Box>
        </Card>

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* ================================================================
            BODY: main column + sidebar
           ================================================================ */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'flex-start' }}>
          {/* ---------------- main ---------------- */}
          <Box sx={{ flex: 1, minWidth: 0, width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card sx={cardSx}>
              <Box sx={{ borderBottom: `1px solid ${LINE}`, px: { xs: 1, md: 2 } }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, v) => setActiveTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: 52,
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', color: MUTED, minHeight: 52, px: 2 },
                    '& .Mui-selected': { color: `${PURPLE_DARK} !important` },
                    '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 3, borderRadius: '3px 3px 0 0' },
                  }}
                >
                  {TABS.map((t) => (
                    <Tab key={t.key} value={t.key} label={t.label} disabled={editing && t.key !== 'overview'} />
                  ))}
                </Tabs>
              </Box>

              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                {/* ---------- OVERVIEW ---------- */}
                {activeTab === 'overview' &&
                  (editing ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <FormSection icon={PersonIcon} title="Personal details" subtitle="How your name and role appear across Hospitium">
                        <TextField
                          label="Given name"
                          required
                          value={editedProfile?.givenName || ''}
                          onChange={(e) => handleFieldChange('givenName', e.target.value)}
                          error={!editedProfile?.givenName?.trim()}
                          helperText={!editedProfile?.givenName?.trim() ? 'Required' : ' '}
                          fullWidth
                          sx={fieldSx}
                        />
                        <TextField
                          label="Family name"
                          value={editedProfile?.familyName || ''}
                          onChange={(e) => handleFieldChange('familyName', e.target.value)}
                          helperText=" "
                          fullWidth
                          sx={fieldSx}
                        />
                        <Autocomplete
                          freeSolo
                          options={ACADEMIC_TITLES}
                          value={erp.academicTitle || ''}
                          onInputChange={(_, value) => handleResearchField('academicTitle', value)}
                          renderInput={(params) => <TextField {...params} label="Academic title" placeholder="e.g. Dr., Prof." sx={fieldSx} />}
                        />
                        <TextField
                          label="Department"
                          value={erp.department || ''}
                          onChange={(e) => handleResearchField('department', e.target.value)}
                          placeholder="e.g. Department of Agricultural Economics"
                          fullWidth
                          sx={fieldSx}
                        />
                        <TextField
                          label="Institution"
                          value={editedProfile?.primaryInstitution || ''}
                          onChange={(e) => handleFieldChange('primaryInstitution', e.target.value)}
                          placeholder="e.g. Egerton University"
                          fullWidth
                          sx={fieldSx}
                          InputProps={{ startAdornment: <InputAdornment position="start"><BusinessIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                        />
                        <TextField
                          label="Phone number"
                          value={erp.phone || ''}
                          onChange={(e) => handleResearchField('phone', e.target.value)}
                          placeholder="+254 7XX XXX XXX"
                          fullWidth
                          sx={fieldSx}
                          InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                        />
                      </FormSection>

                      <FormSection icon={ArticleIcon} title="About your research" subtitle="Shown in the Overview tab">
                        <TextField
                          label="Current focus"
                          value={erp.researchInterests || ''}
                          onChange={(e) => handleResearchField('researchInterests', e.target.value.slice(0, FOCUS_MAX))}
                          placeholder="One or two sentences on what you are working on now"
                          multiline
                          minRows={2}
                          fullWidth
                          helperText={`${(erp.researchInterests || '').length}/${FOCUS_MAX}`}
                          FormHelperTextProps={{ sx: { textAlign: 'right' } }}
                          sx={{ ...fieldSx, gridColumn: '1 / -1' }}
                        />
                        <TextField
                          label="Biography"
                          value={erp.biography || ''}
                          onChange={(e) => handleResearchField('biography', e.target.value.slice(0, BIO_MAX))}
                          placeholder="Your background, research interests and achievements"
                          multiline
                          minRows={5}
                          fullWidth
                          helperText={
                            orcidData?.biography
                              ? `Your ORCID biography is shown on your profile; this is used if ORCID has none. ${(erp.biography || '').length}/${BIO_MAX}`
                              : `${(erp.biography || '').length}/${BIO_MAX}`
                          }
                          sx={{ ...fieldSx, gridColumn: '1 / -1' }}
                        />
                      </FormSection>

                      <FormSection icon={WebIcon} title="Online presence" subtitle="Optional links. Researcher IDs have their own tab.">
                        <TextField
                          label="Website"
                          value={erp.website || ''}
                          onChange={(e) => handleResearchField('website', e.target.value)}
                          placeholder="https://"
                          fullWidth
                          sx={{ ...fieldSx, gridColumn: '1 / -1' }}
                          InputProps={{ startAdornment: <InputAdornment position="start"><LanguageIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                        />
                        <TextField
                          label="LinkedIn"
                          value={erp.linkedin || ''}
                          onChange={(e) => handleResearchField('linkedin', e.target.value)}
                          placeholder="https://linkedin.com/in/…"
                          fullWidth
                          sx={fieldSx}
                          InputProps={{ startAdornment: <InputAdornment position="start"><LinkedInIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                        />
                        <TextField
                          label="X / Twitter"
                          value={erp.twitter || ''}
                          onChange={(e) => handleResearchField('twitter', e.target.value)}
                          placeholder="@handle"
                          fullWidth
                          sx={fieldSx}
                          InputProps={{ startAdornment: <InputAdornment position="start"><TwitterIcon sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                        />
                      </FormSection>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                        <Button onClick={handleCancelEdit} disabled={saving} color="inherit" sx={{ textTransform: 'none' }}>
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveProfile}
                          disabled={saving || !editedProfile?.givenName?.trim()}
                          sx={{ bgcolor: PURPLE, '&:hover': { bgcolor: PURPLE_DARK }, textTransform: 'none', fontWeight: 600 }}
                        >
                          {saving ? 'Saving…' : 'Save profile'}
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {rp.researchInterests && (
                        <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(139,108,188,0.06)', borderLeft: `4px solid ${PURPLE}` }}>
                          <Typography variant="overline" sx={{ color: PURPLE_DARK, fontWeight: 700, letterSpacing: '0.08em', lineHeight: 1 }}>
                            Current focus
                          </Typography>
                          <Typography sx={{ color: INK, lineHeight: 1.7, mt: 1, fontSize: '0.95rem' }}>{rp.researchInterests}</Typography>
                        </Box>
                      )}

                      <Box>
                        <SectionHeading
                          icon={ArticleIcon}
                          title="Biography"
                          action={orcidData?.biography ? <FromOrcidChip /> : null}
                        />
                        {biography ? (
                          <Typography sx={{ color: BODY, lineHeight: 1.85, fontSize: '0.95rem', whiteSpace: 'pre-line' }}>{biography}</Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            No biography yet.{' '}
                            <MuiLink component="button" onClick={startEditing} sx={{ color: PURPLE_DARK, verticalAlign: 'baseline' }}>
                              Add one
                            </MuiLink>
                            {profile?.orcidId ? ' or add it to your ORCID record.' : '.'}
                          </Typography>
                        )}
                      </Box>

                      <Box>
                        <SectionHeading icon={EmailIcon} title="Contact" />
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                          <ContactItem icon={EmailIcon} label="Email" value={profile?.email} href={profile?.email ? `mailto:${profile.email}` : null} />
                          <ContactItem icon={PhoneIcon} label="Phone" value={rp.phone} href={rp.phone ? `tel:${rp.phone}` : null} />
                          <ContactItem icon={LanguageIcon} label="Website" value={rp.website} href={rp.website} external />
                          <ContactItem icon={LinkedInIcon} label="LinkedIn" value={rp.linkedin} href={rp.linkedin} external />
                          <ContactItem
                            icon={TwitterIcon}
                            label="X / Twitter"
                            value={rp.twitter}
                            href={rp.twitter ? (rp.twitter.startsWith('http') ? rp.twitter : `https://x.com/${rp.twitter.replace(/^@/, '')}`) : null}
                            external
                          />
                        </Box>
                      </Box>
                    </Box>
                  ))}

                {/* ---------- EXPERIENCE & EDUCATION ---------- */}
                {activeTab === 'experience' && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
                    <Box>
                      <SectionHeading icon={WorkIcon} title="Employment" action={orcidData?.employments?.length ? <FromOrcidChip /> : null} />
                      <Timeline
                        items={orcidData?.employments}
                        titleKey="role"
                        emptyIcon={WorkIcon}
                        emptyText={profile?.orcidId ? 'Add employment to your ORCID record and it will appear here.' : 'Connect ORCID to show your employment history.'}
                      />
                    </Box>
                    <Box>
                      <SectionHeading icon={SchoolIcon} title="Education" action={orcidData?.educations?.length ? <FromOrcidChip /> : null} />
                      <Timeline
                        items={orcidData?.educations}
                        titleKey="degree"
                        emptyIcon={SchoolIcon}
                        emptyText={profile?.orcidId ? 'Add education to your ORCID record and it will appear here.' : 'Connect ORCID to show your education history.'}
                      />
                    </Box>
                  </Box>
                )}

                {/* ---------- RESEARCHER IDS ---------- */}
                {activeTab === 'ids' && (
                  <ResearcherIdsPanel
                    ids={rp.researcherIds || []}
                    orcidId={profile?.orcidId}
                    onSaved={(researcherIds) => {
                      patchResearchProfile({ researcherIds });
                      setSuccess('Researcher IDs saved');
                    }}
                  />
                )}

                {/* ---------- ACCOUNT & SECURITY ---------- */}
                {activeTab === 'account' && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Box>
                      <SectionHeading icon={PersonIcon} title="Account" subtitle="Your sign-in details" />
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                        <AccountFact label="Email" value={profile?.email} />
                        <AccountFact label="Account type" value={(user?.accountType || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())} />
                        <AccountFact
                          label="Member since"
                          value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                        />
                      </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                      <SectionHeading icon={LockIcon} title="Password" subtitle="Change the password you use to sign in. We'll email you to confirm." />
                      <Box sx={{ flexShrink: 0, mb: { sm: 2 } }}>
                        <ChangePasswordButton onChanged={() => setSuccess('Password updated. A confirmation has been sent to your email.')} />
                      </Box>
                    </Box>

                    {SELF_DELETABLE.includes(user?.accountType) && (
                      <>
                        <Divider />
                        <Box sx={{ border: '1px solid #fecaca', borderRadius: 2, p: { xs: 2, sm: 3 }, bgcolor: '#fffbfb' }}>
                          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.98rem' }}>Delete account</Typography>
                              <Typography variant="body2" sx={{ color: MUTED, mt: 0.5 }}>
                                You&apos;ll be signed out and won&apos;t be able to log in. Your institution administrator can restore the
                                account within 30 days; after that your personal details are anonymised.
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteForeverIcon />}
                              onClick={openDeleteDialog}
                              sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                            >
                              Delete my account
                            </Button>
                          </Box>
                        </Box>
                      </>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Publications */}
            <Card sx={cardSx}>
              <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
                <SectionHeading
                  icon={ArticleIcon}
                  title="Publications"
                  subtitle={
                    worksMeta.hasOrcid
                      ? 'From your ORCID record, plus work published in Hospitium. Citation counts from OpenAlex.'
                      : 'Work published in Hospitium. Connect ORCID to include your full publication record.'
                  }
                  action={
                    publications.length > 0 ? (
                      <Typography variant="caption" sx={{ color: MUTED, whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {publications.length} works
                      </Typography>
                    ) : null
                  }
                />
                {worksMeta.orcidError && (
                  <Alert severity="info" sx={{ mb: 2, borderRadius: 2, py: 0 }}>
                    {worksMeta.orcidError}
                  </Alert>
                )}
                <PublicationsTable
                  works={publications}
                  pageSize={10}
                  emptyMessage={worksMeta.hasOrcid ? 'No works found on ORCID or in Hospitium' : 'No published works yet. Add your ORCID iD to pull in your publication record.'}
                />
              </CardContent>
            </Card>
          </Box>

          {/* ---------------- sidebar ---------------- */}
          <Box sx={{ width: { xs: '100%', lg: 340 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ResearchExpertiseCard
              keywords={rp.keywords || []}
              onSaved={(keywords) => {
                patchResearchProfile({ keywords });
                setSuccess('Research expertise updated');
              }}
            />
            <CitedByCard
              metrics={metrics}
              error={worksMeta.hasOrcid ? worksMeta.metricsError || 'No citation data found for your ORCID iD yet.' : null}
              source={worksMeta.metricsSource}
            />
            <PublicAccessCard metrics={metrics} />
            <CoauthorsCard metrics={metrics} />
          </Box>
        </Box>
      </Container>

      {/* Delete account confirmation */}
      <InstitutionModal open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} disableClose={deleting}>
        <InstitutionModalHeader
          icon={DeleteForeverIcon}
          title="Delete your account"
          subtitle="Restorable by your institution for 30 days"
          tone="danger"
          onClose={() => setDeleteOpen(false)}
          disableClose={deleting}
        />
        <InstitutionModalBody>
          <Alert severity="warning" icon={<WarningIcon />} sx={{ borderRadius: 2 }}>
            You will be signed out immediately and won&apos;t be able to log in. Your publications, manuscripts, proposals and
            other research records stay with your institution. After 30 days your name, email, ORCID and profile are anonymised
            and the account can no longer be restored.
          </Alert>
          <InstitutionModalSection title="Confirm">
            {deleteError && (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
                {deleteError}
              </Alert>
            )}
            <TextField
              fullWidth
              size="small"
              type="password"
              label="Your password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              disabled={deleting}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Type DELETE to confirm"
              autoComplete="off"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              disabled={deleting}
            />
          </InstitutionModalSection>
        </InstitutionModalBody>
        <InstitutionModalFooter>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={deleting || deleteConfirm !== 'DELETE' || !deletePassword}
          >
            {deleting ? 'Deleting...' : 'Delete my account'}
          </Button>
        </InstitutionModalFooter>
      </InstitutionModal>
    </Box>
  );
};

function ContactItem({ icon: Icon, label, value, href, external }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 1.5, border: `1px solid ${LINE}`, minWidth: 0 }}>
      <Icon sx={{ fontSize: 18, color: value ? PURPLE : '#cbd5e1' }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: MUTED, display: 'block', lineHeight: 1.2 }}>
          {label}
        </Typography>
        {value ? (
          href ? (
            <MuiLink
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              underline="hover"
              noWrap
              sx={{ display: 'block', color: INK, fontSize: '0.86rem' }}
            >
              {value.replace(/^https?:\/\/(www\.)?/, '')}
            </MuiLink>
          ) : (
            <Typography noWrap sx={{ color: INK, fontSize: '0.86rem' }}>
              {value}
            </Typography>
          )
        ) : (
          <Typography sx={{ color: '#cbd5e1', fontSize: '0.86rem' }}>Not added</Typography>
        )}
      </Box>
    </Box>
  );
}

function AccountFact({ label, value }) {
  return (
    <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: '#f8fafc', border: `1px solid ${LINE}`, minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: MUTED, fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography noWrap sx={{ color: INK, fontSize: '0.9rem', fontWeight: 500 }}>
        {value || '—'}
      </Typography>
    </Box>
  );
}

export default ResearcherProfilePage;
