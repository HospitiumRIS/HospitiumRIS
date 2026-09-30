'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  Domain as DomainIcon,
  Extension as ModuleIcon,
  Info as InfoIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../components/AuthProvider';
import InstitutionAdminLayout from '../../../components/InstitutionAdmin/InstitutionAdminLayout';
import { notifyInstitutionProfileUpdated } from '../../../components/InstitutionAdmin/InstitutionAdminContext';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#7a5caa';

const EMPTY_DATA = {
  institution: { name: '', slug: '', type: '', storageBucket: null, createdAt: null },
  enabledModules: [],
  modules: [],
  preferences: {
    emailMemberSignup: true,
    emailSecurityAlerts: true,
    emailWeeklyDigest: false,
    notifyPendingApprovals: true,
  },
  domainSummary: { total: 0, verified: 0, autoApprove: 0, items: [] },
  memberCount: 0,
};

function PageHeading({ title, subtitle, action }) {
  return (
    <Box sx={{ mb: 3, p: { xs: 2, md: 2.5 }, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}`, bgcolor: 'background.paper' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Box>
          <Typography variant="overline" sx={{ color: alpha(PURPLE, 0.75), fontWeight: 700, letterSpacing: '0.08em' }}>
            Institution Admin
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mt: 0.25 }}>{title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>
        </Box>
        {action}
      </Stack>
    </Box>
  );
}

function SectionCard({ title, description, children, action }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}`, overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${alpha(PURPLE, 0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
          {description ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{description}</Typography> : null}
        </Box>
        {action}
      </Box>
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Paper>
  );
}

const SettingsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(EMPTY_DATA);
  const [selectedModules, setSelectedModules] = useState([]);
  const [preferences, setPreferences] = useState(EMPTY_DATA.preferences);
  const [dirty, setDirty] = useState(false);
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

  const showNotice = (message, severity = 'success') => {
    setNotice({ open: true, message, severity });
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/institution-admin/settings', { credentials: 'include' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load settings');
      }

      const next = payload.data || EMPTY_DATA;
      setData(next);
      setSelectedModules(next.enabledModules || []);
      setPreferences(next.preferences || EMPTY_DATA.preferences);
      setDirty(false);
    } catch (err) {
      console.error('Error loading settings:', err);
      showNotice(err.message || 'Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.accountType === 'INSTITUTION_ADMIN') {
      loadData();
    }
  }, [user, loadData]);

  const toggleModule = (key) => {
    setSelectedModules((prev) => {
      const next = prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key];
      setDirty(true);
      return next;
    });
  };

  const updatePreference = (field, value) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (selectedModules.length === 0) {
      showNotice('At least one module must remain enabled', 'warning');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/institution-admin/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabledModules: selectedModules,
          preferences,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to save settings');
      }

      setData((prev) => ({
        ...prev,
        enabledModules: payload.data.enabledModules,
        modules: payload.data.modules,
        preferences: payload.data.preferences,
        institution: { ...prev.institution, ...payload.data.institution },
      }));
      setSelectedModules(payload.data.enabledModules);
      setPreferences(payload.data.preferences);
      setDirty(false);
      notifyInstitutionProfileUpdated();
      showNotice('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      showNotice(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.accountType !== 'INSTITUTION_ADMIN') {
    return null;
  }

  const { institution, domainSummary, memberCount, modules } = data;

  return (
    <InstitutionAdminLayout>
      <Box sx={{ p: { xs: 2, sm: 3 }, width: '100%' }}>
        <PageHeading
          title="System settings"
          subtitle={
            institution.name
              ? `Configure modules and notifications for ${institution.name}.`
              : 'Manage institution modules and admin preferences.'
          }
          action={(
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading || saving}
                sx={{ textTransform: 'none', fontWeight: 600, borderColor: alpha(PURPLE, 0.35), color: PURPLE_DARK, '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={!dirty || saving || loading}
                sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: PURPLE_DARK } }}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </Stack>
          )}
        />

        {dirty ? (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            You have unsaved changes.
          </Alert>
        ) : null}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 0.6fr' }, gap: 2.5 }}>
          <Stack spacing={2.5}>
            <SectionCard
              title="Module access"
              description="Choose which platform modules are available to your institution members"
              action={<Chip size="small" label={`${selectedModules.length} enabled`} sx={{ bgcolor: alpha(PURPLE, 0.12), color: PURPLE_DARK, fontWeight: 700 }} />}
            >
              {loading ? (
                <Stack spacing={1}>{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="rounded" height={56} />)}</Stack>
              ) : (
                <Stack spacing={1}>
                  {(modules.length ? modules : EMPTY_DATA.modules).map((mod) => {
                    const enabled = selectedModules.includes(mod.key);
                    return (
                      <Stack
                        key={mod.key}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          border: `1px solid ${enabled ? alpha(PURPLE, 0.25) : alpha(PURPLE, 0.1)}`,
                          bgcolor: enabled ? alpha(PURPLE, 0.04) : 'background.paper',
                        }}
                      >
                        <Stack direction="row" spacing={1.25} alignItems="flex-start">
                          <ModuleIcon sx={{ fontSize: 20, color: enabled ? PURPLE : alpha(PURPLE, 0.4), mt: 0.25 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{mod.defaultLabel}</Typography>
                            <Typography variant="caption" color="text.secondary">{mod.description}</Typography>
                          </Box>
                        </Stack>
                        <Switch
                          checked={enabled}
                          onChange={() => toggleModule(mod.key)}
                          sx={{ '& .Mui-checked': { color: PURPLE }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: alpha(PURPLE, 0.5) } }}
                        />
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </SectionCard>

            <SectionCard title="Admin notifications" description="Email alerts for your institution admin account">
              {loading ? (
                <Stack spacing={1}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={40} />)}</Stack>
              ) : (
                <Stack spacing={0.5}>
                  {[
                    { key: 'emailMemberSignup', label: 'New member sign-ups', description: 'When someone registers with your institution' },
                    { key: 'emailSecurityAlerts', label: 'Security alerts', description: 'Failed logins and permission errors' },
                    { key: 'notifyPendingApprovals', label: 'Pending approvals', description: 'Users waiting for institution access' },
                    { key: 'emailWeeklyDigest', label: 'Weekly digest', description: 'Summary of institution activity' },
                  ].map((item) => (
                    <FormControlLabel
                      key={item.key}
                      control={(
                        <Switch
                          checked={Boolean(preferences[item.key])}
                          onChange={(e) => updatePreference(item.key, e.target.checked)}
                          sx={{ '& .Mui-checked': { color: PURPLE }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: alpha(PURPLE, 0.5) } }}
                        />
                      )}
                      label={(
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                        </Box>
                      )}
                      sx={{ alignItems: 'flex-start', ml: 0, py: 0.75, borderBottom: `1px solid ${alpha(PURPLE, 0.08)}`, width: '100%' }}
                    />
                  ))}
                  <Alert severity="info" icon={<InfoIcon fontSize="inherit" />} sx={{ mt: 1.5, borderRadius: 1.5 }}>
                    Notification delivery depends on platform email configuration.
                  </Alert>
                </Stack>
              )}
            </SectionCard>
          </Stack>

          <Stack spacing={2.5}>
            <SectionCard
              title="Member onboarding"
              description="Domain-based access configured for your institution"
              action={(
                <Button component={Link} href="/institution-admin/verified-domains" size="small" endIcon={<ArrowForwardIcon />} sx={{ textTransform: 'none', color: PURPLE_DARK, fontWeight: 600 }}>
                  Manage
                </Button>
              )}
            >
              {loading ? (
                <Stack spacing={1}>{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={32} />)}</Stack>
              ) : (
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Verified domains</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{domainSummary.verified} / {domainSummary.total}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Auto-approve enabled</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{domainSummary.autoApprove}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Total members</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{memberCount}</Typography>
                  </Stack>
                  {domainSummary.items.length > 0 ? (
                    <Stack spacing={0.75} sx={{ mt: 1 }}>
                      {domainSummary.items.map((domain) => (
                        <Stack key={domain.id} direction="row" spacing={1} alignItems="center" sx={{ p: 1, borderRadius: 1.5, border: `1px solid ${alpha(PURPLE, 0.1)}` }}>
                          <DomainIcon sx={{ fontSize: 16, color: PURPLE }} />
                          <Typography variant="caption" sx={{ flex: 1, fontWeight: 600 }}>{domain.domain}</Typography>
                          <Chip size="small" label={domain.status.toLowerCase()} sx={{ textTransform: 'capitalize', height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No domains configured yet</Typography>
                  )}
                </Stack>
              )}
            </SectionCard>

            <SectionCard title="System info" description="Institution identifiers and storage">
              {loading ? (
                <Stack spacing={1}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={28} />)}</Stack>
              ) : (
                <Stack spacing={1.25}>
                  {[
                    { label: 'Slug', value: institution.slug || '—' },
                    { label: 'Type', value: (institution.type || '—').replace(/_/g, ' ') },
                    { label: 'Storage bucket', value: institution.storageBucket || 'Default (shared)' },
                    {
                      label: 'Created',
                      value: institution.createdAt
                        ? new Date(institution.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—',
                    },
                  ].map((row) => (
                    <Stack key={row.label} direction="row" justifyContent="space-between" spacing={2}>
                      <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', textTransform: row.label === 'Type' ? 'capitalize' : 'none' }}>{row.value}</Typography>
                    </Stack>
                  ))}
                  <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                    <StorageIcon sx={{ fontSize: 16, color: alpha(PURPLE, 0.55) }} />
                    <Typography variant="caption" color="text.secondary">
                      Storage isolation overrides are managed by platform administrators.
                    </Typography>
                  </Stack>
                </Stack>
              )}
            </SectionCard>

            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: `1px solid ${alpha(PURPLE, 0.12)}` }}>
              <Stack spacing={1}>
                <Button component={Link} href="/institution-admin/profile" variant="outlined" fullWidth startIcon={<SettingsIcon />} sx={{ textTransform: 'none', fontWeight: 600, borderColor: alpha(PURPLE, 0.35), color: PURPLE_DARK, '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}>
                  Institution profile
                </Button>
                <Button component={Link} href="/institution-admin/account-types" variant="outlined" fullWidth startIcon={<SettingsIcon />} sx={{ textTransform: 'none', fontWeight: 600, borderColor: alpha(PURPLE, 0.35), color: PURPLE_DARK, '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}>
                  Account types
                </Button>
                <Button component={Link} href="/institution-admin/security" variant="outlined" fullWidth startIcon={<SettingsIcon />} sx={{ textTransform: 'none', fontWeight: 600, borderColor: alpha(PURPLE, 0.35), color: PURPLE_DARK, '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}>
                  Security dashboard
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      </Box>

      <Snackbar open={notice.open} autoHideDuration={6000} onClose={() => setNotice((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={notice.severity} onClose={() => setNotice((prev) => ({ ...prev, open: false }))} sx={{ borderRadius: 2, width: '100%' }}>
          {notice.message}
        </Alert>
      </Snackbar>
    </InstitutionAdminLayout>
  );
};

export default SettingsPage;
