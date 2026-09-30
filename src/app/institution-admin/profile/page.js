'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Business as InstitutionIcon,
  CheckCircle as CheckIcon,
  Delete as DeleteIcon,
  Language as WebsiteIcon,
  PhotoCamera as PhotoCameraIcon,
  Public as CountryIcon,
  Save as SaveIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import InstitutionAdminLayout from '../../../components/InstitutionAdmin/InstitutionAdminLayout';
import { notifyInstitutionProfileUpdated, useInstitutionAdmin } from '../../../components/InstitutionAdmin/InstitutionAdminContext';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';

const INSTITUTION_TYPES = [
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'RESEARCH_INSTITUTE', label: 'Research Institute' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'GOVERNMENT', label: 'Government Agency' },
  { value: 'PRIVATE', label: 'Private Organization' },
  { value: 'NON_PROFIT', label: 'Non-Profit Organization' },
  { value: 'OTHER', label: 'Other' },
];

const DOMAIN_STATUS = {
  VERIFIED: { bg: alpha(PURPLE, 0.12), color: PURPLE_DARK, label: 'Verified' },
  PENDING: { bg: '#fef3c7', color: '#b45309', label: 'Pending' },
  SUSPENDED: { bg: '#fee2e2', color: '#b91c1c', label: 'Suspended' },
};

const emptyForm = {
  name: '',
  slug: '',
  contactEmail: '',
  website: '',
  country: '',
  type: 'UNIVERSITY',
};

const fieldSx = {
  '& .MuiInputBase-root': { borderRadius: 1.5 },
};

function SectionCard({ title, description, children, action }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${alpha(PURPLE, 0.12)}`,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          borderBottom: `1px solid ${alpha(PURPLE, 0.1)}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {description}
            </Typography>
          ) : null}
        </Box>
        {action}
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

function ProfileHeading({ title, subtitle }) {
  return (
    <Box
      sx={{
        mb: 3,
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        border: `1px solid ${alpha(PURPLE, 0.12)}`,
        bgcolor: 'background.paper',
      }}
    >
      <Typography variant="overline" sx={{ color: alpha(PURPLE, 0.75), fontWeight: 700, letterSpacing: '0.08em' }}>
        Institution Admin
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mt: 0.25 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}

function CompletionItem({ label, done }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <CheckIcon sx={{ fontSize: 16, color: done ? PURPLE : alpha(PURPLE, 0.25) }} />
      <Typography variant="body2" sx={{ color: done ? 'text.primary' : 'text.secondary', fontWeight: done ? 600 : 400 }}>
        {label}
      </Typography>
    </Stack>
  );
}

const InstitutionProfilePage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { logoSrc } = useInstitutionAdmin();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [institution, setInstitution] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [domainInput, setDomainInput] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [logoVersion, setLogoVersion] = useState(Date.now());
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.accountType !== 'INSTITUTION_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (user?.accountType === 'INSTITUTION_ADMIN') {
      fetchProfile();
    }
  }, [user]);

  const showNotice = (message, severity = 'success') => {
    setNotice({ open: true, message, severity });
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/institution-admin/profile', { credentials: 'include' });
      const data = await response.json();
      if (!response.ok) {
        showNotice(data.error || 'Failed to load institution profile', 'error');
        return;
      }
      setInstitution(data.institution);
      setForm({
        name: data.institution.name || '',
        slug: data.institution.slug || '',
        contactEmail: data.institution.contactEmail || '',
        website: data.institution.website || '',
        country: data.institution.country || '',
        type: data.institution.type || 'UNIVERSITY',
      });
      setLogoVersion(Date.now());
    } catch (error) {
      console.error(error);
      showNotice('Failed to load institution profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showNotice('Institution name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/institution-admin/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice(data.error || 'Failed to save profile', 'error');
        return;
      }
      setInstitution(data.institution);
      notifyInstitutionProfileUpdated();
      showNotice('Institution profile saved');
    } catch (error) {
      console.error(error);
      showNotice('Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);
    setUploadingLogo(true);
    try {
      const response = await fetch('/api/institution-admin/profile/logo', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice(data.error || 'Failed to upload logo', 'error');
        return;
      }
      setInstitution((prev) => (prev ? { ...prev, logo: data.logo } : prev));
      setLogoVersion(Date.now());
      notifyInstitutionProfileUpdated();
      showNotice('Logo updated');
    } catch (error) {
      console.error(error);
      showNotice('Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    try {
      const response = await fetch('/api/institution-admin/profile/logo', {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice(data.error || 'Failed to remove logo', 'error');
        return;
      }
      setInstitution((prev) => (prev ? { ...prev, logo: null } : prev));
      setLogoVersion(Date.now());
      notifyInstitutionProfileUpdated();
      showNotice('Logo removed');
    } catch (error) {
      console.error(error);
      showNotice('Failed to remove logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleAddDomain = async () => {
    const domain = domainInput
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '');
    if (!domain) return;

    setAddingDomain(true);
    try {
      const response = await fetch('/api/institution-admin/verified-domains', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          status: 'VERIFIED',
          verificationMethod: 'MANUAL',
          autoApproveUsers: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice(data.error || 'Failed to add domain', 'error');
        return;
      }
      setDomainInput('');
      await fetchProfile();
      showNotice('Domain added');
    } catch (error) {
      console.error(error);
      showNotice('Failed to add domain', 'error');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (!confirm('Remove this domain?')) return;
    try {
      const response = await fetch(`/api/institution-admin/verified-domains/${domainId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice(data.error || 'Failed to remove domain', 'error');
        return;
      }
      await fetchProfile();
      showNotice('Domain removed');
    } catch (error) {
      console.error(error);
      showNotice('Failed to remove domain', 'error');
    }
  };

  const hasLogo = Boolean(institution?.logo);
  const logoPreview = hasLogo
    ? `/api/institution-admin/profile/logo?v=${logoVersion}`
    : logoSrc;

  const completionItems = useMemo(() => [
    { label: 'Institution name', done: Boolean(form.name.trim()) },
    { label: 'Country', done: Boolean(form.country.trim()) },
    { label: 'Logo uploaded', done: hasLogo },
    { label: 'Contact email', done: Boolean(form.contactEmail.trim()) },
    { label: 'Verified domain', done: (institution?.domains || []).length > 0 },
  ], [form.name, form.country, form.contactEmail, hasLogo, institution?.domains]);

  const completionPercent = Math.round(
    (completionItems.filter((item) => item.done).length / completionItems.length) * 100
  );

  const isDirty = useMemo(() => {
    if (!institution) return false;
    return (
      form.name !== (institution.name || '')
      || form.slug !== (institution.slug || '')
      || form.contactEmail !== (institution.contactEmail || '')
      || form.website !== (institution.website || '')
      || form.country !== (institution.country || '')
      || form.type !== (institution.type || 'UNIVERSITY')
    );
  }, [form, institution]);

  if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
    return null;
  }

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
        <ProfileHeading
          title={t('institution_admin.institution_profile', { defaultValue: 'Institution Profile' })}
          subtitle="Manage your institution identity, contact details, and verified email domains."
        />

        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={120} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 0.6fr' }, gap: 2 }}>
              <Skeleton variant="rounded" height={420} />
              <Skeleton variant="rounded" height={420} />
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2.5}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `1px solid ${alpha(PURPLE, 0.12)}`,
                bgcolor: alpha(PURPLE, 0.04),
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: PURPLE_DARK }}>
                      Profile completeness
                    </Typography>
                    <Chip
                      size="small"
                      label={`${completionPercent}%`}
                      sx={{ bgcolor: alpha(PURPLE, 0.14), color: PURPLE_DARK, fontWeight: 700 }}
                    />
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={completionPercent}
                    sx={{
                      height: 8,
                      borderRadius: 99,
                      bgcolor: alpha(PURPLE, 0.1),
                      '& .MuiLinearProgress-bar': { bgcolor: PURPLE, borderRadius: 99 },
                    }}
                  />
                </Box>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  sx={{
                    bgcolor: PURPLE,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2.5,
                    '&:hover': { bgcolor: PURPLE_DARK },
                  }}
                >
                  {saving ? 'Saving...' : isDirty ? 'Save changes' : 'Saved'}
                </Button>
              </Stack>
            </Paper>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.45fr 0.55fr' }, gap: 2.5, alignItems: 'start' }}>
              <Stack spacing={2.5}>
                <SectionCard
                  title="Institution details"
                  description="Core information shown across HospitiumRIS for your organization."
                >
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      fullWidth
                      required
                      size="small"
                      label="Institution name"
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      sx={{ ...fieldSx, gridColumn: { sm: '1 / -1' } }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Slug"
                      name="slug"
                      value={form.slug}
                      onChange={handleFormChange}
                      helperText="Used in URLs. Letters, numbers, and hyphens only."
                      sx={fieldSx}
                    />
                    <FormControl fullWidth size="small" sx={fieldSx}>
                      <InputLabel>Institution type</InputLabel>
                      <Select name="type" value={form.type} label="Institution type" onChange={handleFormChange}>
                        {INSTITUTION_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      size="small"
                      label="Country"
                      name="country"
                      value={form.country}
                      onChange={handleFormChange}
                      InputProps={{ startAdornment: <CountryIcon sx={{ mr: 1, color: alpha(PURPLE, 0.5), fontSize: 18 }} /> }}
                      sx={fieldSx}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      type="email"
                      label="Contact email"
                      name="contactEmail"
                      value={form.contactEmail}
                      onChange={handleFormChange}
                      sx={fieldSx}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Website"
                      name="website"
                      value={form.website}
                      onChange={handleFormChange}
                      placeholder="https://example.edu"
                      InputProps={{ startAdornment: <WebsiteIcon sx={{ mr: 1, color: alpha(PURPLE, 0.5), fontSize: 18 }} /> }}
                      sx={fieldSx}
                    />
                  </Box>
                </SectionCard>

                <SectionCard
                  title="Verified domains"
                  description="Users with matching email domains can be linked to this institution."
                  action={(
                    <Button
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => router.push('/institution-admin/verified-domains')}
                      sx={{ textTransform: 'none', color: PURPLE_DARK, fontWeight: 600, whiteSpace: 'nowrap' }}
                    >
                      Manage all
                    </Button>
                  )}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Domain"
                      placeholder="university.edu"
                      value={domainInput}
                      onChange={(event) => setDomainInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleAddDomain();
                        }
                      }}
                      sx={fieldSx}
                    />
                    <Button
                      variant="outlined"
                      startIcon={addingDomain ? <CircularProgress size={14} /> : <AddIcon />}
                      onClick={handleAddDomain}
                      disabled={addingDomain || !domainInput.trim()}
                      sx={{
                        whiteSpace: 'nowrap',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: alpha(PURPLE, 0.35),
                        color: PURPLE_DARK,
                        '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) },
                      }}
                    >
                      Add domain
                    </Button>
                  </Stack>

                  <TableContainer sx={{ border: `1px solid ${alpha(PURPLE, 0.1)}`, borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(PURPLE, 0.04) }}>
                          <TableCell sx={{ fontWeight: 700 }}>Domain</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(institution?.domains || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                              <Stack spacing={1} alignItems="center">
                                <VerifiedIcon sx={{ color: alpha(PURPLE, 0.4) }} />
                                <Typography variant="body2" color="text.secondary">
                                  No domains added yet
                                </Typography>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ) : (
                          institution.domains.map((domain) => {
                            const tone = DOMAIN_STATUS[domain.status] || DOMAIN_STATUS.PENDING;
                            return (
                              <TableRow key={domain.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{domain.domain}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    size="small"
                                    label={tone.label}
                                    sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, height: 24 }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  <Tooltip title="Remove domain">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteDomain(domain.id)}
                                      sx={{ color: '#b91c1c', bgcolor: alpha('#b91c1c', 0.08), '&:hover': { bgcolor: alpha('#b91c1c', 0.14) } }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </SectionCard>
              </Stack>

              <Stack spacing={2.5}>
                <SectionCard title="Institution logo" description="Shown in the sidebar, dashboard, and researcher-facing pages.">
                  <Stack spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: '100%',
                        p: 2,
                        borderRadius: 2,
                        border: `1px dashed ${alpha(PURPLE, 0.25)}`,
                        bgcolor: alpha(PURPLE, 0.03),
                        display: 'flex',
                        justifyContent: 'center',
                      }}
                    >
                      <Avatar
                        src={logoPreview}
                        variant="rounded"
                        sx={{
                          width: 120,
                          height: 120,
                          bgcolor: alpha(PURPLE, 0.12),
                          color: PURPLE,
                          border: `1px solid ${alpha(PURPLE, 0.18)}`,
                          '& img': { objectFit: 'contain', p: 1 },
                        }}
                      >
                        <InstitutionIcon sx={{ fontSize: 48 }} />
                      </Avatar>
                    </Box>
                    <Typography variant="caption" color="text.secondary" align="center">
                      PNG, JPG, or WebP · Maximum 2 MB
                    </Typography>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      hidden
                      onChange={handleLogoSelected}
                    />
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={uploadingLogo ? <CircularProgress size={14} color="inherit" /> : <PhotoCameraIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                        sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: PURPLE_DARK } }}
                      >
                        {uploadingLogo ? 'Uploading...' : hasLogo ? 'Change logo' : 'Upload logo'}
                      </Button>
                      {hasLogo ? (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={handleRemoveLogo}
                          disabled={uploadingLogo}
                          sx={{ textTransform: 'none', fontWeight: 600, minWidth: 96 }}
                        >
                          Remove
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </SectionCard>

                <SectionCard title="Profile checklist" description="Complete these items to finish your institution setup.">
                  <Stack spacing={1.25}>
                    {completionItems.map((item) => (
                      <CompletionItem key={item.label} label={item.label} done={item.done} />
                    ))}
                  </Stack>
                </SectionCard>

                {institution?.updatedAt ? (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: `1px solid ${alpha(PURPLE, 0.12)}`,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last updated
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                      {new Date(institution.updatedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                    {institution.slug ? (
                      <>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
                          Public slug
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {institution.slug}
                        </Typography>
                      </>
                    ) : null}
                  </Paper>
                ) : null}
              </Stack>
            </Box>
          </Stack>
        )}
      </Box>

      <Snackbar
        open={notice.open}
        autoHideDuration={5000}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notice.severity}
          onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2, width: '100%' }}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </InstitutionAdminLayout>
  );
};

export default InstitutionProfilePage;
