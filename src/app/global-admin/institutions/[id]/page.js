'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Domain as DomainIcon,
  Edit as EditIcon,
  LockReset as LockResetIcon,
  ManageAccounts as ManageAccountsIcon,
  Person as PersonIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../../components/AuthProvider';
import GlobalAdminLayout from '../../../../components/GlobalAdmin/GlobalAdminLayout';
import {
  EditInstitutionDialog,
  ReassignAdminDialog,
  ResetAdminPasswordDialog,
} from '../../../../components/GlobalAdmin/InstitutionManageDialogs';
import { INSTITUTION_MODULES } from '../../../../lib/institution-modules';
import { INSTITUTION_TYPES } from '../../../../lib/institution-types';

const InstitutionModulesPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const institutionId = params?.id;

  const [institution, setInstitution] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.accountType !== 'GLOBAL_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (user?.accountType === 'GLOBAL_ADMIN' && institutionId) {
      fetchInstitution();
    }
  }, [user, institutionId]);

  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const fetchInstitution = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/global-admin/institutions/${institutionId}`);
      const data = await response.json();
      if (!response.ok) {
        showAlert(data.error || 'Failed to load institution', 'error');
        return;
      }
      setInstitution(data.institution);
      setSelected(Array.isArray(data.institution.enabledModules) ? data.institution.enabledModules : []);
    } catch (error) {
      console.error(error);
      showAlert('Failed to load institution', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (key) => {
    setSelected((prev) => (
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    ));
  };

  const toggleAll = (checked) => {
    setSelected(checked ? INSTITUTION_MODULES.map((mod) => mod.key) : []);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/global-admin/institutions/${institutionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabledModules: selected }),
      });
      const data = await response.json();
      if (!response.ok) {
        showAlert(data.error || 'Failed to save modules', 'error');
        return;
      }
      setInstitution(data.institution);
      setSelected(data.institution.enabledModules || []);
      showAlert('Module access updated', 'success');
    } catch (error) {
      console.error(error);
      showAlert('Failed to save modules', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDialogSaved = async (_payload, message) => {
    showAlert(message || 'Updated', 'success');
    await fetchInstitution();
  };

  if (!user || user.accountType !== 'GLOBAL_ADMIN') {
    return null;
  }

  const allSelected = selected.length === INSTITUTION_MODULES.length;
  const typeLabel = INSTITUTION_TYPES.find((type) => type.value === institution?.type)?.label || institution?.type || '—';

  return (
    <GlobalAdminLayout>
      <Container maxWidth="lg" sx={{ pt: { xs: 6, sm: 7, md: 8 }, pb: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/global-admin/institutions')}
          sx={{ mb: 2 }}
        >
          Back to institutions
        </Button>

        {alert.show && (
          <Alert severity={alert.severity} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setAlert({ ...alert, show: false })}>
            {alert.message}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : !institution ? (
          <Alert severity="error">Institution not found</Alert>
        ) : (
          <>
            <Box sx={{ mb: 4, pb: 3, borderBottom: '2px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, letterSpacing: '-0.02em' }}>
                    {institution.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Edit institution details, manage the admin, and select module access
                  </Typography>
                </Box>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
                  {t('global_admin.edit_details', { defaultValue: 'Edit details' })}
                </Button>
              </Box>
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <Paper sx={{ p: 2, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Slug</Typography>
                <Typography variant="body1" fontWeight={600}>{institution.slug}</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Contact email</Typography>
                <Typography variant="body1" fontWeight={600}>{institution.contactEmail || '—'}</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography variant="body1" fontWeight={600}>{typeLabel}</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Country</Typography>
                <Typography variant="body1" fontWeight={600}>{institution.country || '—'}</Typography>
              </Paper>
            </Stack>

            {institution.website && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="caption" color="text.secondary">Website</Typography>
                <Typography variant="body1" fontWeight={600}>{institution.website}</Typography>
              </Paper>
            )}

            <Paper sx={{ p: 2, mb: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <PersonIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2">Institution admin</Typography>
                  </Stack>
                  <Typography variant="body1" fontWeight={600}>
                    {institution.admin
                      ? `${institution.admin.givenName} ${institution.admin.familyName}`
                      : 'Not assigned'}
                  </Typography>
                  {institution.admin && (
                    <Typography variant="body2" color="text.secondary">
                      {institution.admin.email}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button
                    variant="outlined"
                    startIcon={<ManageAccountsIcon />}
                    onClick={() => setReassignOpen(true)}
                  >
                    {institution.admin
                      ? t('global_admin.reassign_admin', { defaultValue: 'Reassign admin' })
                      : t('global_admin.assign_admin', { defaultValue: 'Assign admin' })}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LockResetIcon />}
                    onClick={() => setResetOpen(true)}
                    disabled={!institution.admin}
                  >
                    {t('global_admin.reset_admin_password', { defaultValue: 'Reset password' })}
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <DomainIcon fontSize="small" color="action" />
                <Typography variant="subtitle2">Verified domains</Typography>
              </Stack>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {(institution.domains || []).map((domain) => (
                  <Chip key={domain.id} label={domain.domain} size="small" color="success" variant="outlined" />
                ))}
                {(!institution.domains || institution.domains.length === 0) && (
                  <Typography variant="body2" color="text.secondary">No domains yet</Typography>
                )}
              </Box>
              <AddDomainRow institutionId={institution.id} onAdded={fetchInstitution} onError={showAlert} />
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t('global_admin.select_modules', { defaultValue: 'Module access' })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selected.length} of {INSTITUTION_MODULES.length} modules enabled
                  </Typography>
                </Box>
                <FormControlLabel
                  control={<Switch checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} />}
                  label={allSelected ? 'All enabled' : 'Enable all'}
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                }}
              >
                {INSTITUTION_MODULES.map((mod) => {
                  const checked = selected.includes(mod.key);
                  return (
                    <Card
                      key={mod.key}
                      variant="outlined"
                      sx={{
                        borderColor: checked ? 'primary.main' : 'divider',
                        bgcolor: checked ? `${theme.palette.primary.main}0A` : 'background.paper',
                      }}
                    >
                      <CardActionArea onClick={() => toggleModule(mod.key)}>
                        <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Checkbox checked={checked} tabIndex={-1} disableRipple />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {t(mod.labelKey, { defaultValue: mod.defaultLabel })}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {mod.description}
                            </Typography>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save modules'}
                </Button>
              </Box>
            </Paper>
          </>
        )}

        <EditInstitutionDialog
          open={editOpen}
          institution={institution}
          onClose={() => setEditOpen(false)}
          onSaved={handleDialogSaved}
        />
        <ReassignAdminDialog
          open={reassignOpen}
          institution={institution}
          onClose={() => setReassignOpen(false)}
          onSaved={handleDialogSaved}
        />
        <ResetAdminPasswordDialog
          open={resetOpen}
          institution={institution}
          onClose={() => setResetOpen(false)}
          onSaved={handleDialogSaved}
        />
      </Container>
    </GlobalAdminLayout>
  );
};

function AddDomainRow({ institutionId, onAdded, onError }) {
  const [domain, setDomain] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!domain.trim()) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/global-admin/institutions/${institutionId}/domains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        onError?.(data.error || 'Failed to add domain', 'error');
        return;
      }
      setDomain('');
      onError?.('Domain added', 'success');
      onAdded?.();
    } catch (error) {
      console.error(error);
      onError?.('Failed to add domain', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
      <TextField
        size="small"
        fullWidth
        placeholder="university.edu"
        value={domain}
        onChange={(event) => setDomain(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleAdd();
          }
        }}
      />
      <Button variant="outlined" onClick={handleAdd} disabled={saving || !domain.trim()}>
        {saving ? 'Adding...' : 'Add domain'}
      </Button>
    </Stack>
  );
}

export default InstitutionModulesPage;
