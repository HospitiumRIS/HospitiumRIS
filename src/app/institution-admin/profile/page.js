'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  MenuItem,
  Paper,
  Select,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Business as InstitutionIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import InstitutionAdminLayout from '../../../components/InstitutionAdmin/InstitutionAdminLayout';
import { notifyInstitutionProfileUpdated } from '../../../components/InstitutionAdmin/InstitutionAdminContext';

const INSTITUTION_TYPES = [
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'RESEARCH_INSTITUTE', label: 'Research Institute' },
  { value: 'HOSPITAL', label: 'Hospital' },
  { value: 'GOVERNMENT', label: 'Government Agency' },
  { value: 'PRIVATE', label: 'Private Organization' },
  { value: 'NON_PROFIT', label: 'Non-Profit Organization' },
  { value: 'OTHER', label: 'Other' },
];

const emptyForm = {
  name: '',
  slug: '',
  contactEmail: '',
  website: '',
  country: '',
  type: 'UNIVERSITY',
};

const InstitutionProfilePage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [institution, setInstitution] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [domainInput, setDomainInput] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [logoVersion, setLogoVersion] = useState(Date.now());
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

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

  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/institution-admin/profile');
      const data = await response.json();
      if (!response.ok) {
        showAlert(data.error || 'Failed to load institution profile', 'error');
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
      showAlert('Failed to load institution profile', 'error');
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
      showAlert('Institution name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/institution-admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        showAlert(data.error || 'Failed to save profile', 'error');
        return;
      }
      setInstitution(data.institution);
      notifyInstitutionProfileUpdated();
      showAlert('Institution profile saved', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Failed to save profile', 'error');
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
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        showAlert(data.error || 'Failed to upload logo', 'error');
        return;
      }
      setInstitution((prev) => (prev ? { ...prev, logo: data.logo } : prev));
      setLogoVersion(Date.now());
      notifyInstitutionProfileUpdated();
      showAlert('Logo updated', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setUploadingLogo(true);
    try {
      const response = await fetch('/api/institution-admin/profile/logo', { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        showAlert(data.error || 'Failed to remove logo', 'error');
        return;
      }
      setInstitution((prev) => (prev ? { ...prev, logo: null } : prev));
      setLogoVersion(Date.now());
      notifyInstitutionProfileUpdated();
      showAlert('Logo removed', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Failed to remove logo', 'error');
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
        showAlert(data.error || 'Failed to add domain', 'error');
        return;
      }
      setDomainInput('');
      await fetchProfile();
      showAlert('Domain added', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Failed to add domain', 'error');
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (domainId) => {
    if (!confirm('Remove this domain?')) return;
    try {
      const response = await fetch(`/api/institution-admin/verified-domains/${domainId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        showAlert(data.error || 'Failed to remove domain', 'error');
        return;
      }
      await fetchProfile();
      showAlert('Domain removed', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Failed to remove domain', 'error');
    }
  };

  if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
    return null;
  }

  const hasLogo = Boolean(institution?.logo);

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Box sx={{ mb: 4, pb: 3, borderBottom: '2px solid', borderColor: 'divider' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: 'linear-gradient(135deg, #8b6cbc 0%, #7a5caa 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            {t('institution_admin.institution_profile', { defaultValue: 'Institution Profile' })}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Manage your institution name, logo, and verified domains
          </Typography>
        </Box>

        {alert.show && (
          <Alert severity={alert.severity} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setAlert({ ...alert, show: false })}>
            {alert.message}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Logo
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                <Avatar
                  src={hasLogo ? `/api/institution-admin/profile/logo?v=${logoVersion}` : undefined}
                  sx={{
                    width: 96,
                    height: 96,
                    bgcolor: '#8b6cbc',
                    boxShadow: '0 4px 12px rgba(139, 108, 188, 0.3)',
                  }}
                >
                  <InstitutionIcon sx={{ fontSize: 40 }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    PNG, JPG, or WebP. Maximum 2 MB.
                  </Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={handleLogoSelected}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                      sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5caa' } }}
                    >
                      {uploadingLogo ? 'Uploading...' : hasLogo ? 'Change logo' : 'Upload logo'}
                    </Button>
                    {hasLogo && (
                      <Button color="error" onClick={handleRemoveLogo} disabled={uploadingLogo}>
                        Remove
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Institution details
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2.5,
                }}
              >
                <TextField
                  fullWidth
                  required
                  label="Institution name"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                />
                <TextField
                  fullWidth
                  label="Slug"
                  name="slug"
                  value={form.slug}
                  onChange={handleFormChange}
                  helperText="Used in URLs. Letters, numbers, and hyphens only."
                />
                <TextField
                  fullWidth
                  type="email"
                  label="Contact email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleFormChange}
                />
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={form.website}
                  onChange={handleFormChange}
                  placeholder="https://example.edu"
                />
                <FormControl fullWidth>
                  <InputLabel>Institution type</InputLabel>
                  <Select name="type" value={form.type} label="Institution type" onChange={handleFormChange}>
                    {INSTITUTION_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Country"
                  name="country"
                  value={form.country}
                  onChange={handleFormChange}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ bgcolor: '#8b6cbc', '&:hover': { bgcolor: '#7a5caa' } }}
                >
                  {saving ? 'Saving...' : 'Save details'}
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Verified domains
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Users whose email matches these domains can be linked to this institution.
              </Typography>
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
                />
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddDomain}
                  disabled={addingDomain || !domainInput.trim()}
                  sx={{ whiteSpace: 'nowrap', borderColor: '#8b6cbc', color: '#8b6cbc' }}
                >
                  {addingDomain ? 'Adding...' : 'Add domain'}
                </Button>
              </Stack>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Domain</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(institution?.domains || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No domains added yet
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      institution.domains.map((domain) => (
                        <TableRow key={domain.id} hover>
                          <TableCell>{domain.domain}</TableCell>
                          <TableCell>
                            <Chip
                              label={domain.status}
                              size="small"
                              color={domain.status === 'VERIFIED' ? 'success' : domain.status === 'SUSPENDED' ? 'error' : 'warning'}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Remove domain">
                              <IconButton size="small" color="error" onClick={() => handleDeleteDomain(domain.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        )}
      </Box>
    </InstitutionAdminLayout>
  );
};

export default InstitutionProfilePage;
