'use client';

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider,
  Select,
  FormControl,
  InputLabel,
  MenuItem,
  ListItemButton,
  Button,
  ButtonGroup,
  Paper,
  Grid,
} from '@mui/material';
import {
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Accessibility as AccessibilityIcon,
  Translate as TranslateIcon,
  FontDownload as FontDownloadIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../ThemeProvider';
import { useAuth } from '../AuthProvider';
import i18n from '@/lib/i18n';

const SettingsSection = ({ label, children }) => (
  <Box sx={{ mb: 2 }}>
    <Typography
      variant="overline"
      sx={{
        px: 1,
        mb: 0.5,
        display: 'block',
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        color: 'text.disabled',
        fontWeight: 700,
      }}
    >
      {label}
    </Typography>
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {children}
    </Paper>
  </Box>
);

const FONT_SIZES = [
  { label: 'S', value: 12 },
  { label: 'M', value: 16 },
  { label: 'L', value: 20 },
  { label: 'XL', value: 24 },
];

// Languages organized by region groups
const LANGUAGE_GROUPS = [
  {
    title: 'AU Languages',
    languages: [
      { code: 'en', name: 'English' },
      { code: 'sw', name: 'Kiswahili' },
      { code: 'fr', name: 'French' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'es', name: 'Spanish' },
      { code: 'ar', name: 'Arabic' },
    ],
  },
  {
    title: 'Europe',
    languages: [
      { code: 'de', name: 'German' },
    ],
  },
  {
    title: 'Asia-Pacific',
    subgroups: [
      {
        languages: [
          { code: 'id', name: 'Indonesian' },
          { code: 'ms', name: 'Malay' },
          { code: 'km', name: 'Khmer' },
          { code: 'hi', name: 'Hindi' },
          { code: 'vi', name: 'Vietnamese' },
          { code: 'ko', name: 'Korean' },
        ],
      },
      {
        languages: [
          { code: 'lo', name: 'Lao' },
          { code: 'zh', name: 'Mandarin' },
          { code: 'my', name: 'Burmese' },
          { code: 'fil', name: 'Filipino' },
          { code: 'th', name: 'Thai' },
          { code: 'tet', name: 'Tetum' },
        ],
      },
    ],
  },
];

// Flat array for easy lookup
const LANGUAGES = LANGUAGE_GROUPS.flatMap(group => 
  group.languages ? group.languages : group.subgroups.flatMap(sub => sub.languages)
);

const SettingsDrawer = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { logout } = useAuth();
  const [fontSize, setFontSize] = useState(16);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    setLanguage(i18n.language?.split('-')[0] || 'en');
  }, []);

  const handleCloseDrawer = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    onClose(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/');
    }
  };

  const handleFontSize = (value) => {
    setFontSize(value);
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${value}px`;
    }
  };

  const handleLanguageChange = (event) => {
    const code = event.target.value;
    setLanguage(code);
    i18n.changeLanguage(code);
    // Save language preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18nextLng', code);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      disableScrollLock
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '92vw', sm: 380 },
          maxWidth: 380,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.default,
        },
      }}
    >
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2.5,
          py: 1.5,
          backgroundColor: theme.palette.background.paper,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t('settings_drawer.title')}
        </Typography>
        <IconButton onClick={handleCloseDrawer} size="small" aria-label={t('settings_drawer.close')}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
        <SettingsSection label={t('settings_drawer.appearance')}>
          <ListItem
            sx={{ px: 2, py: 1.5 }}
            secondaryAction={
              <Switch
                checked={isDarkMode}
                onChange={toggleTheme}
                color="primary"
                inputProps={{ 'aria-label': t('settings_drawer.toggle_dark') }}
              />
            }
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {isDarkMode
                ? <DarkModeIcon color="primary" fontSize="small" />
                : <LightModeIcon color="primary" fontSize="small" />}
            </ListItemIcon>
            <ListItemText
              primary={t('settings_drawer.dark_mode')}
              secondary={isDarkMode ? t('settings_drawer.dark_on') : t('settings_drawer.light_on')}
              primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>

          <Divider />

          <ListItem sx={{ px: 2, py: 1.5, flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <FontDownloadIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" fontWeight={600}>{t('settings_drawer.font_size')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('settings_drawer.font_size_hint')}
                </Typography>
              </Box>
            </Box>
            <ButtonGroup
              fullWidth
              variant="outlined"
              size="large"
              aria-label={t('settings_drawer.font_size')}
              sx={{ '& .MuiButtonGroup-grouped': { borderRadius: 0 } }}
            >
              {FONT_SIZES.map(({ label, value }) => (
                <Button
                  key={value}
                  onClick={() => handleFontSize(value)}
                  variant={fontSize === value ? 'contained' : 'outlined'}
                  color="primary"
                  sx={{ flex: 1, fontWeight: fontSize === value ? 700 : 400, py: 1.2 }}
                  aria-pressed={fontSize === value}
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </ListItem>
        </SettingsSection>

        <SettingsSection label={t('settings_drawer.preferences')}>
          <ListItem sx={{ px: 2, py: 1.5, flexDirection: 'column', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <TranslateIcon color="primary" fontSize="small" />
              <Box>
                <Typography variant="body2" fontWeight={600}>{t('settings_drawer.language')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('settings_drawer.language_hint')}
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
                backgroundColor: 'background.paper',
              }}
            >
              {LANGUAGE_GROUPS.map((group, groupIndex) => (
                <Box key={group.title}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ display: 'block', mb: 1, fontSize: '0.7rem' }}
                  >
                    {group.title}
                  </Typography>
                  {group.languages ? (
                    <Grid container spacing={1} sx={{ mb: groupIndex < LANGUAGE_GROUPS.length - 1 ? 2 : 0 }}>
                      {group.languages.map((lang) => (
                        <Grid item xs={6} key={lang.code}>
                          <Button
                            fullWidth
                            variant={language === lang.code ? 'contained' : 'outlined'}
                            onClick={() => handleLanguageChange({ target: { value: lang.code } })}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.8rem',
                              py: 0.75,
                              fontWeight: language === lang.code ? 600 : 400,
                            }}
                          >
                            {lang.name}
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    group.subgroups.map((subgroup, subIndex) => (
                      <Grid 
                        container 
                        spacing={1} 
                        key={subIndex}
                        sx={{ mb: subIndex < group.subgroups.length - 1 ? 1.5 : (groupIndex < LANGUAGE_GROUPS.length - 1 ? 2 : 0) }}
                      >
                        {subgroup.languages.map((lang) => (
                          <Grid item xs={6} key={lang.code}>
                            <Button
                              fullWidth
                              variant={language === lang.code ? 'contained' : 'outlined'}
                              onClick={() => handleLanguageChange({ target: { value: lang.code } })}
                              sx={{
                                textTransform: 'none',
                                fontSize: '0.8rem',
                                py: 0.75,
                                fontWeight: language === lang.code ? 600 : 400,
                              }}
                            >
                              {lang.name}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>
                    ))
                  )}
                </Box>
              ))}
            </Box>
          </ListItem>
        </SettingsSection>

        <SettingsSection label={t('settings_drawer.account')}>
          <List disablePadding>
            <ListItemButton sx={{ px: 2, py: 1.5 }} onClick={() => router.push('/researcher/settings')}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <AccountCircleIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t('settings_drawer.profile_settings')}
                secondary={t('settings_drawer.profile_settings_desc')}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
            </ListItemButton>

            <Divider />

            <ListItemButton sx={{ px: 2, py: 1.5 }} onClick={() => router.push('/researcher/settings#accessibility')}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <AccessibilityIcon color="primary" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t('settings_drawer.accessibility')}
                secondary={t('settings_drawer.accessibility_desc')}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
              <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
            </ListItemButton>
          </List>
        </SettingsSection>

        <SettingsSection label={t('settings_drawer.session')}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              px: 2,
              py: 1.5,
              color: 'error.main',
              '&:hover': { backgroundColor: 'error.light', color: 'error.contrastText' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon color="error" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={t('settings_drawer.logout')}
              secondary={t('settings_drawer.logout_desc')}
              primaryTypographyProps={{ variant: 'body2', fontWeight: 600, color: 'error.main' }}
              secondaryTypographyProps={{ variant: 'caption', color: 'error.light' }}
            />
          </ListItemButton>
        </SettingsSection>
      </Box>

      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center">
          {t('settings_drawer.saved_auto')}
        </Typography>
      </Box>
    </Drawer>
  );
};

export default SettingsDrawer;
