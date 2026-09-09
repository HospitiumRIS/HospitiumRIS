'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  Chip,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Grid,
  MenuItem,
  alpha,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Verified as VerifiedIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  Language as WebsiteIcon,
  Public as CountryIcon,
  Badge as RoleIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import { useAuth } from '@/components/AuthProvider';

const PURPLE = '#8b6cbc';

const INSTITUTION_TYPES = [
  'University',
  'Hospital',
  'Research Institute',
  'Government Agency',
  'Other',
];

export default function InstitutionProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [edited, setEdited] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!['RESEARCH_ADMIN', 'INSTITUTION_ADMIN'].includes(user.accountType)) {
      router.push('/institution');
      return;
    }
    fetchProfile();
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/institution/profile', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load profile');
      const data = await res.json();
      setProfile(data.profile);
      setEdited(data.profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const res = await fetch('/api/institution/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          givenName: edited.givenName,
          familyName: edited.familyName,
          primaryInstitution: edited.primaryInstitution,
          institution: edited.institution,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setProfile(data.profile);
      setEdited(data.profile);
      setEditing(false);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEdited(profile);
    setEditing(false);
    setError(null);
  };

  const updateField = (field, value) => {
    setEdited((prev) => ({ ...prev, [field]: value }));
  };

  const updateInstitution = (field, value) => {
    setEdited((prev) => ({
      ...prev,
      institution: { ...(prev.institution || {}), [field]: value },
    }));
  };

  const displayName = profile
    ? `${profile.givenName || ''} ${profile.familyName || ''}`.trim()
    : '';
  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  if (authLoading || loading) {
    return (
      <>
        <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
          <PageHeader
            title="Institution Profile"
            description="Manage your account and institution details"
            icon={<PersonIcon sx={{ fontSize: 32 }} />}
            breadcrumbs={[
              { label: 'Institution', path: '/institution' },
              { label: 'Profile' },
            ]}
            gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          />
        </Box>
        <Container maxWidth="md" sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: PURPLE }} />
        </Container>
      </>
    );
  }

  return (
    <>
      <Box sx={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}>
        <PageHeader
          title="Institution Profile"
          description="Manage your account and institution details"
          icon={<PersonIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Institution', path: '/institution' },
            { label: 'Profile' },
          ]}
          gradient="linear-gradient(135deg, #8b6cbc 0%, #a084d1 50%, #b794f4 100%)"
          actionButton={
            !editing ? (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
                sx={{ bgcolor: 'white', color: PURPLE, fontWeight: 700, '&:hover': { bgcolor: '#f5f0ff' } }}
              >
                Edit Profile
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                  disabled={saving}
                  sx={{ borderColor: 'white', color: 'white' }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ bgcolor: 'white', color: PURPLE, fontWeight: 700 }}
                >
                  {saving ? 'Saving…' : t('common.save')}
                </Button>
              </Stack>
            )
          }
        />
      </Box>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Profile header card */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'center', sm: 'flex-start' }}>
            <Avatar sx={{ width: 88, height: 88, bgcolor: PURPLE, fontSize: '2rem', fontWeight: 700 }}>
              {initials}
            </Avatar>
            <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{displayName}</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'center', sm: 'flex-start' }} sx={{ mb: 1 }}>
                <Chip
                  icon={<RoleIcon sx={{ fontSize: '16px !important' }} />}
                  label="Research Administrator"
                  size="small"
                  sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 600 }}
                />
                {profile?.emailVerified && (
                  <Chip
                    icon={<VerifiedIcon sx={{ fontSize: '16px !important' }} />}
                    label="Verified"
                    size="small"
                    sx={{ bgcolor: alpha('#22c55e', 0.1), color: '#16a34a', fontWeight: 600 }}
                  />
                )}
                <Chip label={profile?.status} size="small" variant="outlined" />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
                <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
              </Stack>
              {profile?.orcidId && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  ORCID: {profile.orcidId}
                </Typography>
              )}
            </Box>
          </Stack>
        </Paper>

        {/* Personal information */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
            <PersonIcon sx={{ color: PURPLE }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Personal Information</Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={edited?.givenName || ''}
                onChange={(e) => updateField('givenName', e.target.value)}
                disabled={!editing}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={edited?.familyName || ''}
                onChange={(e) => updateField('familyName', e.target.value)}
                disabled={!editing}
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={profile?.email || ''}
                disabled
                size="small"
                helperText="Contact support to change your email address"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Primary Institution (display name)"
                value={edited?.primaryInstitution || ''}
                onChange={(e) => updateField('primaryInstitution', e.target.value)}
                disabled={!editing}
                size="small"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Institution details */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3, mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
            <BusinessIcon sx={{ color: PURPLE }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Institution Details</Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Institution Name"
                value={edited?.institution?.name || ''}
                onChange={(e) => updateInstitution('name', e.target.value)}
                disabled={!editing}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Institution Type"
                value={edited?.institution?.type || ''}
                onChange={(e) => updateInstitution('type', e.target.value)}
                disabled={!editing}
                size="small"
              >
                {INSTITUTION_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                value={edited?.institution?.country || ''}
                onChange={(e) => updateInstitution('country', e.target.value)}
                disabled={!editing}
                size="small"
                InputProps={{ startAdornment: <CountryIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} /> }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Website"
                value={edited?.institution?.website || ''}
                onChange={(e) => updateInstitution('website', e.target.value)}
                disabled={!editing}
                size="small"
                placeholder="https://"
                InputProps={{ startAdornment: <WebsiteIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} /> }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Account info (read-only) */}
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 3, bgcolor: alpha(PURPLE, 0.02) }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: 'text.secondary' }}>
            Account Information
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Account type</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{profile?.accountType?.replace('_', ' ')}</Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Member since</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : '—'}
              </Typography>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">Last updated</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {profile?.updatedAt
                  ? new Date(profile.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </>
  );
}
