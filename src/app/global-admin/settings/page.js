'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Typography,
  Paper,
  LinearProgress,
  IconButton,
  Tooltip,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Chip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Computer as SystemIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Api as ApiIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import GlobalAdminLayout from '../../../components/GlobalAdmin/GlobalAdminLayout';

const SettingsPage = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', severity: 'info' });
  const [activeTab, setActiveTab] = useState('system');
  const [settings, setSettings] = useState({
    system: {
      siteName: '',
      siteUrl: '',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      lockoutDuration: 15
    },
    email: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpSecure: true,
      fromEmail: '',
      fromName: ''
    },
    security: {
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
      twoFactorEnabled: false,
      rateLimitEnabled: true,
      rateLimitRequests: 100,
      rateLimitWindow: 15
    },
    notifications: {
      emailNotifications: true,
      systemAlerts: true,
      securityAlerts: true,
      maintenanceAlerts: true,
      digestFrequency: 'daily'
    },
    storage: {
      maxFileSize: 10,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'],
      storageProvider: 'local',
      storageQuota: 1000
    },
    api: {
      apiEnabled: true,
      apiRateLimit: 1000,
      apiRateLimitWindow: 60,
      webhooksEnabled: false,
      corsEnabled: true,
      allowedOrigins: ['http://localhost:3000']
    }
  });

  useEffect(() => {
    if (!authLoading && user?.accountType !== 'GLOBAL_ADMIN') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.accountType === 'GLOBAL_ADMIN') {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/global-admin/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showAlert('Failed to fetch settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchSettings();
  };

  const showAlert = (message, severity = 'info') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => setAlert({ show: false, message: '', severity: 'info' }), 5000);
  };

  const handleSettingChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async (category) => {
    try {
      setSaving(true);
      const response = await fetch('/api/global-admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          settings: settings[category]
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved successfully`, 'success');
      } else {
        showAlert(data.error || 'Failed to save settings', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showAlert('An error occurred while saving settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'system', label: 'System', icon: <SystemIcon /> },
    { id: 'email', label: 'Email', icon: <EmailIcon /> },
    { id: 'security', label: 'Security', icon: <SecurityIcon /> },
    { id: 'notifications', label: 'Notifications', icon: <NotificationsIcon /> },
    { id: 'storage', label: 'Storage', icon: <StorageIcon /> },
    { id: 'api', label: 'API', icon: <ApiIcon /> }
  ];

  if (authLoading) {
    return null;
  }

  return (
    <GlobalAdminLayout>
      <Container maxWidth="xl" sx={{ pt: { xs: 3, sm: 4, md: 5 } }}>
        {/* Header */}
        <Box sx={{ 
          mb: 4,
          pb: 3,
          borderBottom: '2px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.02em'
                }}
              >
                {t('global_admin.settings')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                {t('global_admin.settings_subtitle')}
              </Typography>
            </Box>
            <Tooltip title="Refresh settings">
              <IconButton 
                onClick={handleRefresh} 
                sx={{ 
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  boxShadow: 2
                }}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3 }} />}

        {/* Alert */}
        {alert.show && (
          <Alert severity={alert.severity} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setAlert({ ...alert, show: false })}>
            {alert.message}
          </Alert>
        )}

        {/* Settings Tabs */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2.5, 
          mb: 4,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          '& > *': {
            flex: {
              xs: '1 1 calc(50% - 10px)',
              sm: '1 1 0'
            },
            minWidth: 0
          }
        }}>
          {tabs.map((tab) => (
            <Paper 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              sx={{ 
                p: 2, 
                borderRadius: 2,
                bgcolor: activeTab === tab.id ? theme.palette.primary.main : 'background.paper',
                color: activeTab === tab.id ? 'white' : 'text.primary',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: activeTab === tab.id ? theme.palette.primary.dark : 'action.hover',
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1
              }}
            >
              {React.cloneElement(tab.icon, { 
                sx: { fontSize: 24, opacity: activeTab === tab.id ? 1 : 0.7 } 
              })}
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                {tab.label}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* Settings Content */}
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          {/* System Settings */}
          {activeTab === 'system' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                System Configuration
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Site Name"
                  value={settings.system.siteName}
                  onChange={(e) => handleSettingChange('system', 'siteName', e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Site URL"
                  value={settings.system.siteUrl}
                  onChange={(e) => handleSettingChange('system', 'siteUrl', e.target.value)}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.system.maintenanceMode}
                      onChange={(e) => handleSettingChange('system', 'maintenanceMode', e.target.checked)}
                    />
                  }
                  label="Maintenance Mode"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.system.allowRegistration}
                      onChange={(e) => handleSettingChange('system', 'allowRegistration', e.target.checked)}
                    />
                  }
                  label="Allow User Registration"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.system.requireEmailVerification}
                      onChange={(e) => handleSettingChange('system', 'requireEmailVerification', e.target.checked)}
                    />
                  }
                  label="Require Email Verification"
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Session Timeout (minutes)"
                  value={settings.system.sessionTimeout}
                  onChange={(e) => handleSettingChange('system', 'sessionTimeout', parseInt(e.target.value))}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Max Login Attempts"
                  value={settings.system.maxLoginAttempts}
                  onChange={(e) => handleSettingChange('system', 'maxLoginAttempts', parseInt(e.target.value))}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Account Lockout Duration (minutes)"
                  value={settings.system.lockoutDuration}
                  onChange={(e) => handleSettingChange('system', 'lockoutDuration', parseInt(e.target.value))}
                />
              </Box>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveSettings('system')}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save System Settings'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Email Configuration
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  value={settings.email.smtpHost}
                  onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="SMTP Port"
                  value={settings.email.smtpPort}
                  onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value))}
                />
                <TextField
                  fullWidth
                  label="SMTP Username"
                  value={settings.email.smtpUser}
                  onChange={(e) => handleSettingChange('email', 'smtpUser', e.target.value)}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.email.smtpSecure}
                      onChange={(e) => handleSettingChange('email', 'smtpSecure', e.target.checked)}
                    />
                  }
                  label="Use Secure Connection (TLS)"
                />
                <TextField
                  fullWidth
                  label="From Email Address"
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) => handleSettingChange('email', 'fromEmail', e.target.value)}
                />
                <TextField
                  fullWidth
                  label="From Name"
                  value={settings.email.fromName}
                  onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
                />
              </Box>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveSettings('email')}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Email Settings'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Security Configuration
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Password Length"
                  value={settings.security.passwordMinLength}
                  onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.passwordRequireUppercase}
                      onChange={(e) => handleSettingChange('security', 'passwordRequireUppercase', e.target.checked)}
                    />
                  }
                  label="Require Uppercase Letters"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.passwordRequireLowercase}
                      onChange={(e) => handleSettingChange('security', 'passwordRequireLowercase', e.target.checked)}
                    />
                  }
                  label="Require Lowercase Letters"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.passwordRequireNumbers}
                      onChange={(e) => handleSettingChange('security', 'passwordRequireNumbers', e.target.checked)}
                    />
                  }
                  label="Require Numbers"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.passwordRequireSpecialChars}
                      onChange={(e) => handleSettingChange('security', 'passwordRequireSpecialChars', e.target.checked)}
                    />
                  }
                  label="Require Special Characters"
                />
                <Divider sx={{ my: 2 }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.twoFactorEnabled}
                      onChange={(e) => handleSettingChange('security', 'twoFactorEnabled', e.target.checked)}
                    />
                  }
                  label="Enable Two-Factor Authentication"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.security.rateLimitEnabled}
                      onChange={(e) => handleSettingChange('security', 'rateLimitEnabled', e.target.checked)}
                    />
                  }
                  label="Enable Rate Limiting"
                />
                {settings.security.rateLimitEnabled && (
                  <>
                    <TextField
                      fullWidth
                      type="number"
                      label="Rate Limit (requests)"
                      value={settings.security.rateLimitRequests}
                      onChange={(e) => handleSettingChange('security', 'rateLimitRequests', parseInt(e.target.value))}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="Rate Limit Window (minutes)"
                      value={settings.security.rateLimitWindow}
                      onChange={(e) => handleSettingChange('security', 'rateLimitWindow', parseInt(e.target.value))}
                    />
                  </>
                )}
              </Box>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveSettings('security')}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Security Settings'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Notification Preferences
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.emailNotifications}
                      onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                    />
                  }
                  label="Enable Email Notifications"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.systemAlerts}
                      onChange={(e) => handleSettingChange('notifications', 'systemAlerts', e.target.checked)}
                    />
                  }
                  label="System Alerts"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.securityAlerts}
                      onChange={(e) => handleSettingChange('notifications', 'securityAlerts', e.target.checked)}
                    />
                  }
                  label="Security Alerts"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.maintenanceAlerts}
                      onChange={(e) => handleSettingChange('notifications', 'maintenanceAlerts', e.target.checked)}
                    />
                  }
                  label="Maintenance Alerts"
                />
                <FormControl fullWidth>
                  <InputLabel>Digest Frequency</InputLabel>
                  <Select
                    value={settings.notifications.digestFrequency}
                    label="Digest Frequency"
                    onChange={(e) => handleSettingChange('notifications', 'digestFrequency', e.target.value)}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="never">Never</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveSettings('notifications')}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Notification Settings'}
                </Button>
              </Box>
            </Box>
          )}

          {/* Storage Settings */}
          {activeTab === 'storage' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Storage Configuration
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max File Size (MB)"
                  value={settings.storage.maxFileSize}
                  onChange={(e) => handleSettingChange('storage', 'maxFileSize', parseInt(e.target.value))}
                />
                <FormControl fullWidth>
                  <InputLabel>Storage Provider</InputLabel>
                  <Select
                    value={settings.storage.storageProvider}
                    label="Storage Provider"
                    onChange={(e) => handleSettingChange('storage', 'storageProvider', e.target.value)}
                  >
                    <MenuItem value="local">Local Storage</MenuItem>
                    <MenuItem value="s3">Amazon S3</MenuItem>
                    <MenuItem value="azure">Azure Blob Storage</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  type="number"
                  label="Storage Quota (GB)"
                  value={settings.storage.storageQuota}
                  onChange={(e) => handleSettingChange('storage', 'storageQuota', parseInt(e.target.value))}
                />
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Allowed File Types
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {settings.storage.allowedFileTypes.map((type, index) => (
                      <Chip key={index} label={type} size="small" />
                    ))}
                  </Box>
                </Box>
              </Box>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveSettings('storage')}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Storage Settings'}
                </Button>
              </Box>
            </Box>
          )}

          {/* API Settings */}
          {activeTab === 'api' && (
            <Box>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                API Configuration
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.api.apiEnabled}
                      onChange={(e) => handleSettingChange('api', 'apiEnabled', e.target.checked)}
                    />
                  }
                  label="Enable API Access"
                />
                {settings.api.apiEnabled && (
                  <>
                    <TextField
                      fullWidth
                      type="number"
                      label="API Rate Limit (requests)"
                      value={settings.api.apiRateLimit}
                      onChange={(e) => handleSettingChange('api', 'apiRateLimit', parseInt(e.target.value))}
                    />
                    <TextField
                      fullWidth
                      type="number"
                      label="API Rate Limit Window (minutes)"
                      value={settings.api.apiRateLimitWindow}
                      onChange={(e) => handleSettingChange('api', 'apiRateLimitWindow', parseInt(e.target.value))}
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.api.webhooksEnabled}
                          onChange={(e) => handleSettingChange('api', 'webhooksEnabled', e.target.checked)}
                        />
                      }
                      label="Enable Webhooks"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.api.corsEnabled}
                          onChange={(e) => handleSettingChange('api', 'corsEnabled', e.target.checked)}
                        />
                      }
                      label="Enable CORS"
                    />
                  </>
                )}
              </Box>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSaveSettings('api')}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save API Settings'}
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </GlobalAdminLayout>
  );
};

export default SettingsPage;
