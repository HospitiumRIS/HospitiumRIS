'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Switch,
  Button,
  Alert,
  Select,
  MenuItem,
  Skeleton,
  LinearProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Send as SendIcon,
  ComputerOutlined as SystemIcon,
  EmailOutlined as EmailIcon,
  ShieldOutlined as SecurityIcon,
  NotificationsOutlined as NotificationsIcon,
  FolderOutlined as StorageIcon,
  ApiOutlined as ApiIcon,
} from '@mui/icons-material';
import GlobalAdminLayout from '../../../components/GlobalAdmin/GlobalAdminLayout';
import { useGlobalAdminGuard, PageHeader, StatusPill } from '../../../components/GlobalAdmin/ops/OpsUi';

/**
 * Field layout per tab. Whether a field is editable comes from the API's
 * `meta` (status: active | env | coming_soon), so the page never offers a
 * control the server would ignore.
 */
const SECTIONS = [
  {
    id: 'system',
    label: 'System',
    icon: SystemIcon,
    description: 'Site name, maintenance mode and who can create an account.',
    fields: [
      { key: 'siteName', label: 'Site name', type: 'text', help: 'Shown on the maintenance page.' },
      { key: 'siteUrl', label: 'Site URL', type: 'text', help: 'Used in email links. Set NEXT_PUBLIC_APP_URL on the server to change it.' },
      {
        key: 'maintenanceMode',
        label: 'Maintenance mode',
        type: 'switch',
        help: 'Everyone except global admins sees a maintenance page and cannot sign in.',
      },
      { key: 'maintenanceMessage', label: 'Maintenance message', type: 'multiline', help: 'Shown to users while maintenance mode is on.' },
      { key: 'allowRegistration', label: 'Allow new registrations', type: 'switch', help: 'When off, the sign-up page is closed and the register API refuses new accounts.' },
      { key: 'requireEmailVerification', label: 'Require email verification', type: 'switch' },
      { key: 'sessionTimeout', label: 'Session timeout (minutes)', type: 'number' },
      { key: 'maxLoginAttempts', label: 'Max failed sign-ins before lockout', type: 'number' },
      { key: 'lockoutDuration', label: 'Lockout duration (minutes)', type: 'number' },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    icon: EmailIcon,
    description: 'Outgoing email. Server details come from the SMTP_* environment variables; passwords are never stored here.',
    fields: [
      { key: 'smtpHost', label: 'SMTP host', type: 'text' },
      { key: 'smtpPort', label: 'SMTP port', type: 'text' },
      { key: 'smtpUser', label: 'SMTP user', type: 'text' },
      { key: 'smtpSecure', label: 'Use TLS (SMTP_SECURE)', type: 'switch' },
      { key: 'fromName', label: 'From name', type: 'text', help: 'Sender name on every email HospitiumRIS sends.' },
      { key: 'fromEmail', label: 'From email', type: 'text', help: 'Leave empty to use FROM_EMAIL from the server. Must be an address your SMTP server may send as.' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: SecurityIcon,
    description: 'Password rules apply to registration, password changes and accounts created by admins.',
    fields: [
      { key: 'passwordMinLength', label: 'Minimum password length', type: 'number' },
      { key: 'passwordRequireUppercase', label: 'Require an uppercase letter', type: 'switch' },
      { key: 'passwordRequireLowercase', label: 'Require a lowercase letter', type: 'switch' },
      { key: 'passwordRequireNumbers', label: 'Require a number', type: 'switch' },
      { key: 'passwordRequireSpecialChars', label: 'Require a symbol', type: 'switch' },
      { key: 'twoFactorEnabled', label: 'Two-factor authentication', type: 'switch' },
      { key: 'rateLimitEnabled', label: 'Request rate limiting', type: 'switch' },
      { key: 'rateLimitRequests', label: 'Requests allowed per window', type: 'number' },
      { key: 'rateLimitWindow', label: 'Rate limit window (minutes)', type: 'number' },
      { key: 'ipWhitelist', label: 'Admin IP allow-list', type: 'list' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: NotificationsIcon,
    description: 'Platform-wide notification switches.',
    fields: [
      { key: 'emailNotifications', label: 'Email notifications', type: 'switch' },
      { key: 'systemAlerts', label: 'System alerts', type: 'switch' },
      { key: 'securityAlerts', label: 'Security alerts', type: 'switch' },
      { key: 'maintenanceAlerts', label: 'Maintenance alerts', type: 'switch' },
      { key: 'digestFrequency', label: 'Digest frequency', type: 'select', options: ['daily', 'weekly', 'never'] },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: StorageIcon,
    description: 'File uploads. Each module also has its own size and file-type limits.',
    fields: [
      { key: 'storageProvider', label: 'Storage provider', type: 'text', help: 'Set by STORAGE_DRIVER on the server.' },
      {
        key: 'maxFileSize',
        label: 'Platform upload limit (MB)',
        type: 'number',
        help: 'Uploads larger than this are rejected everywhere, even where a module allows more (module limits go up to 50 MB).',
      },
      { key: 'storageQuota', label: 'Storage quota (GB)', type: 'number' },
      { key: 'allowedFileTypes', label: 'Allowed file types', type: 'list' },
    ],
  },
  {
    id: 'api',
    label: 'API',
    icon: ApiIcon,
    description: 'Public API access, webhooks and CORS.',
    fields: [
      { key: 'apiEnabled', label: 'API enabled', type: 'switch' },
      { key: 'apiRateLimit', label: 'API rate limit (requests)', type: 'number' },
      { key: 'apiRateLimitWindow', label: 'API rate limit window (minutes)', type: 'number' },
      { key: 'webhooksEnabled', label: 'Webhooks', type: 'switch' },
      { key: 'corsEnabled', label: 'CORS', type: 'switch' },
      { key: 'allowedOrigins', label: 'Allowed origins', type: 'list' },
    ],
  },
];

const STATUS_PILL = {
  env: { label: 'Server config', color: 'info' },
  coming_soon: { label: 'Coming soon', color: 'default' },
};

function FieldRow({ field, value, status, error, onChange, meta }) {
  const disabled = status !== 'active';
  const pill = STATUS_PILL[status];

  let control;
  if (field.type === 'switch') {
    control = (
      <Switch
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        inputProps={{ 'aria-label': field.label }}
      />
    );
  } else if (field.type === 'select') {
    control = (
      <Select size="small" value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={disabled} sx={{ minWidth: 180 }}>
        {field.options.map((opt) => (
          <MenuItem key={opt} value={opt} sx={{ textTransform: 'capitalize' }}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    );
  } else {
    const isNumber = field.type === 'number';
    const isList = field.type === 'list';
    control = (
      <TextField
        size="small"
        value={isList ? (Array.isArray(value) ? value.join(', ') : '') : value ?? ''}
        onChange={(e) => onChange(isNumber ? e.target.value.replace(/[^\d]/g, '') : e.target.value)}
        disabled={disabled}
        error={Boolean(error)}
        multiline={field.type === 'multiline'}
        minRows={field.type === 'multiline' ? 2 : undefined}
        inputProps={{
          inputMode: isNumber ? 'numeric' : undefined,
          'aria-label': field.label,
        }}
        placeholder={status === 'env' && !value ? 'Not set' : undefined}
        sx={{ width: { xs: '100%', md: field.type === 'multiline' ? 420 : isNumber ? 160 : 320 } }}
      />
    );
  }

  const rangeHint =
    field.type === 'number' && status === 'active' && meta?.min != null && meta?.max != null
      ? `Between ${meta.min} and ${meta.max}.`
      : '';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: field.type === 'multiline' ? 'flex-start' : 'center' },
        justifyContent: 'space-between',
        gap: { xs: 1, md: 3 },
        px: { xs: 2, md: 3 },
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        opacity: status === 'coming_soon' ? 0.7 : 1,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{field.label}</Typography>
          {pill && <StatusPill label={pill.label} color={pill.color} />}
        </Box>
        {(field.help || rangeHint || error) && (
          <Typography variant="body2" color={error ? 'error.main' : 'text.secondary'} sx={{ mt: 0.25 }}>
            {error || [field.help, rangeHint].filter(Boolean).join(' ')}
          </Typography>
        )}
      </Box>
      <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>{control}</Box>
    </Box>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { ready } = useGlobalAdminGuard();
  const [tab, setTab] = useState('system');
  const [saved, setSaved] = useState(null); // last values from the server
  const [draft, setDraft] = useState(null); // values being edited
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState(null); // { severity, text }
  const [fieldErrors, setFieldErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/global-admin/settings', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to load settings');
      setSaved(json.data);
      setDraft(json.data);
      setMeta(json.meta || {});
      setFieldErrors({});
    } catch (err) {
      setNotice({ severity: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const section = SECTIONS.find((s) => s.id === tab);
  const sectionMeta = meta[tab] || {};

  const activeKeys = useMemo(
    () => section.fields.filter((f) => sectionMeta[f.key]?.status === 'active').map((f) => f.key),
    [section, sectionMeta]
  );
  const dirtyKeys = useMemo(() => {
    if (!saved || !draft) return [];
    return activeKeys.filter((k) => String(draft[tab]?.[k] ?? '') !== String(saved[tab]?.[k] ?? ''));
  }, [activeKeys, draft, saved, tab]);
  const dirtyTabs = useMemo(() => {
    if (!saved || !draft) return new Set();
    return new Set(
      SECTIONS.filter((s) =>
        s.fields.some(
          (f) => meta[s.id]?.[f.key]?.status === 'active' && String(draft[s.id]?.[f.key] ?? '') !== String(saved[s.id]?.[f.key] ?? '')
        )
      ).map((s) => s.id)
    );
  }, [draft, saved, meta]);

  const setField = (key, value) => {
    setDraft((d) => ({ ...d, [tab]: { ...d[tab], [key]: value } }));
    setFieldErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    setFieldErrors({});
    try {
      const payload = {};
      for (const key of activeKeys) {
        const fieldDef = section.fields.find((f) => f.key === key);
        const value = draft[tab][key];
        payload[key] = fieldDef.type === 'number' ? Number(value) : value;
      }
      const res = await fetch('/api/global-admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: tab, settings: payload }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.fieldErrors) setFieldErrors(json.fieldErrors);
        throw new Error(json.error || 'Failed to save settings');
      }
      setSaved((s) => ({ ...s, [tab]: json.data }));
      setDraft((d) => ({ ...d, [tab]: json.data }));
      setNotice({ severity: 'success', text: json.changed?.length ? `${section.label} settings saved.` : 'No changes to save.' });
    } catch (err) {
      setNotice({ severity: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft((d) => ({ ...d, [tab]: saved[tab] }));
    setFieldErrors({});
  };

  const sendTest = async () => {
    setTesting(true);
    setNotice(null);
    try {
      const res = await fetch('/api/global-admin/settings/test-email', { method: 'POST' });
      const json = await res.json();
      setNotice({ severity: json.success ? 'success' : 'error', text: json.message || json.error || 'Test failed' });
    } catch (err) {
      setNotice({ severity: 'error', text: err.message });
    } finally {
      setTesting(false);
    }
  };

  if (!ready) return null;

  const activeFields = section.fields.filter((f) => sectionMeta[f.key]?.status !== 'coming_soon');
  const plannedFields = section.fields.filter((f) => sectionMeta[f.key]?.status === 'coming_soon');
  const turningOnMaintenance = tab === 'system' && draft?.system?.maintenanceMode && !saved?.system?.maintenanceMode;

  return (
    <GlobalAdminLayout>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <PageHeader
          title={t('global_admin.settings', 'System Settings')}
          subtitle={t('global_admin.settings_subtitle')}
          actions={
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={load}
              disabled={loading || saving}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
            >
              Reload
            </Button>
          }
        />

        {saved?.system?.maintenanceMode && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Maintenance mode is <strong>on</strong>. Only global admins can use HospitiumRIS right now.
          </Alert>
        )}
        {notice && (
          <Alert severity={notice.severity} sx={{ mb: 2 }} onClose={() => setNotice(null)}>
            {notice.text}
          </Alert>
        )}

        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => {
              setTab(v);
              setFieldErrors({});
            }}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
              px: { xs: 1, md: 2 },
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 52, fontSize: '0.875rem' },
            }}
          >
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <Tab
                  key={s.id}
                  value={s.id}
                  icon={<Icon sx={{ fontSize: 18 }} />}
                  iconPosition="start"
                  label={
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                      {s.label}
                      {dirtyTabs.has(s.id) && (
                        <Box component="span" title="Unsaved changes" sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'warning.main' }} />
                      )}
                    </Box>
                  }
                />
              );
            })}
          </Tabs>

          {loading && saved && <LinearProgress sx={{ height: 2 }} />}

          <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {section.description}
            </Typography>
          </Box>

          {!draft ? (
            <Box sx={{ px: 3, pb: 3 }}>
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} height={56} />
              ))}
            </Box>
          ) : (
            <>
              {activeFields.length === 0 && (
                <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">
                    Nothing in this section can be changed yet. The options below are planned.
                  </Typography>
                </Box>
              )}

              {activeFields.map((field) => (
                <FieldRow
                  key={field.key}
                  field={field}
                  value={draft[tab]?.[field.key]}
                  status={sectionMeta[field.key]?.status}
                  meta={sectionMeta[field.key]}
                  error={fieldErrors[field.key]}
                  onChange={(v) => setField(field.key, v)}
                />
              ))}

              {tab === 'email' && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    px: { xs: 2, md: 3 },
                    py: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StatusPill
                      label={draft.email.smtpConfigured ? 'SMTP configured' : 'SMTP not configured'}
                      color={draft.email.smtpConfigured ? 'success' : 'warning'}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Sends a test message to your own email address.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SendIcon />}
                    onClick={sendTest}
                    disabled={testing || !draft.email.smtpConfigured || dirtyKeys.length > 0}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                  >
                    {testing ? 'Sending…' : 'Send test email'}
                  </Button>
                </Box>
              )}

              {plannedFields.length > 0 && (
                <>
                  <Box sx={{ px: { xs: 2, md: 3 }, pt: 3, pb: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.disabled' }}>
                      Planned: not active yet
                    </Typography>
                  </Box>
                  {plannedFields.map((field) => (
                    <FieldRow
                      key={field.key}
                      field={field}
                      value={draft[tab]?.[field.key]}
                      status="coming_soon"
                      meta={sectionMeta[field.key]}
                      onChange={() => {}}
                    />
                  ))}
                </>
              )}

              {activeKeys.length > 0 && (
                <Box
                  sx={{
                    position: 'sticky',
                    bottom: 0,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 1.5,
                    px: { xs: 2, md: 3 },
                    py: 1.5,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  {turningOnMaintenance && (
                    <Typography variant="body2" color="warning.main" sx={{ mr: 'auto', fontWeight: 500 }}>
                      Saving will lock out everyone except global admins.
                    </Typography>
                  )}
                  {!turningOnMaintenance && dirtyKeys.length > 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 'auto' }}>
                      {dirtyKeys.length} unsaved {dirtyKeys.length === 1 ? 'change' : 'changes'}
                    </Typography>
                  )}
                  <Button onClick={discard} disabled={!dirtyKeys.length || saving} sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Discard
                  </Button>
                  <Button
                    variant="contained"
                    color={turningOnMaintenance ? 'warning' : 'primary'}
                    startIcon={<SaveIcon />}
                    onClick={save}
                    disabled={!dirtyKeys.length || saving}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5 }}
                  >
                    {saving ? 'Saving…' : `Save ${section.label.toLowerCase()} settings`}
                  </Button>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Container>
    </GlobalAdminLayout>
  );
}
