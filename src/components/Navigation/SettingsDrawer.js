'use client';

import React, { useState } from 'react';
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
  FormControlLabel,
  Divider,
  Select,
  FormControl,
  InputLabel,
  Slider,
  MenuItem,
  ListItemButton,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Accessibility as AccessibilityIcon,
  Translate as TranslateIcon,
  FontDownload as FontDownloadIcon,
  AccountCircle as AccountCircleIcon,
  Login as LoginIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useThemeMode } from '../ThemeProvider';
import { useAuth } from '../AuthProvider';

const SettingsDrawer = ({ isOpen, onClose }) => {
  const theme = useTheme();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { logout } = useAuth();
  const [fontSize, setFontSize] = useState(16);
  const [language, setLanguage] = useState('en');
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
      // Force navigation even if logout fails
      router.push('/');
    }
  };

  const handleFontSizeChange = (event, newValue) => {
    setFontSize(newValue);
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${newValue}px`;
    }
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
    console.log('Language changed to:', event.target.value);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
  ];

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      disableScrollLock
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '90vw', sm: 350 },
          maxWidth: 350,
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
            Settings
          </Typography>
          <IconButton onClick={handleCloseDrawer} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <List sx={{ p: 0 }}>
          {/* Theme Toggle */}
          <ListItem sx={{ px: 0, py: 2 }}>
            <ListItemIcon>
              {isDarkMode ? <DarkModeIcon color="primary" /> : <LightModeIcon color="primary" />}
            </ListItemIcon>
            <ListItemText
              primary="Dark Mode"
              secondary="Toggle between light and dark theme"
              sx={{
                '& .MuiListItemText-secondary': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  color="primary"
                  size={isMobile ? "small" : "medium"}
                />
              }
              label=""
              sx={{ m: 0 }}
            />
          </ListItem>

          <Divider sx={{ my: 2 }} />

          {/* Accessibility - Font Size */}
          <ListItem sx={{ px: 0, py: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%' }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <FontDownloadIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Font Size"
                secondary="Adjust text size for better readability"
                sx={{
                  '& .MuiListItemText-secondary': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              />
            </Box>
            <Box sx={{ width: '100%', px: { xs: 1, sm: 2 } }}>
              <Slider
                value={fontSize}
                onChange={handleFontSizeChange}
                min={12}
                max={24}
                step={1}
                marks={[
                  { value: 12, label: 'S' },
                  { value: 16, label: 'M' },
                  { value: 20, label: 'L' },
                  { value: 24, label: 'XL' },
                ]}
                valueLabelDisplay="auto"
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          </ListItem>

          <Divider sx={{ my: 2 }} />

          {/* Language Selection */}
          <ListItem sx={{ px: 0, py: 2, flexDirection: 'column', alignItems: 'flex-start' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%' }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <TranslateIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Language"
                secondary="Choose your preferred language"
                sx={{
                  '& .MuiListItemText-secondary': {
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }
                }}
              />
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Language</InputLabel>
              <Select
                value={language}
                label="Language"
                onChange={handleLanguageChange}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    <Typography variant="body2">{lang.name}</Typography>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </ListItem>

          <Divider sx={{ my: 2 }} />

          {/* Profile Link */}
          <ListItem sx={{ px: 0, py: 2 }}>
            <ListItemIcon>
              <AccountCircleIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Profile Settings"
              secondary="Manage your account and preferences"
            />
          </ListItem>

          {/* Accessibility Info */}
          <ListItem sx={{ px: 0, py: 2 }}>
            <ListItemIcon>
              <AccessibilityIcon color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="Accessibility"
              secondary="These settings help improve your experience"
              sx={{
                '& .MuiListItemText-secondary': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }
              }}
            />
          </ListItem>

          {/* Logout */}
          <ListItem disablePadding>
            <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1 }}>
              <ListItemIcon>
                <LoginIcon color="error" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </ListItem>
        </List>

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            align="center"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            Settings are saved automatically
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default SettingsDrawer;
