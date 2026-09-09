'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Button,
  ButtonGroup,
  Menu,
  MenuItem,
  Popover,
  Typography,
  Divider,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  KeyboardArrowDown as ArrowDownIcon,
  TextFields as TextFieldsIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useThemeMode } from './ThemeProvider';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

export const TOPBAR_HEIGHT = 36;
export const APP_BAR_HEIGHT = 64;
export const NAVBAR_OFFSET = TOPBAR_HEIGHT + APP_BAR_HEIGHT;

const FONT_SIZES = [
  { label: 'S', value: 12 },
  { label: 'M', value: 16 },
  { label: 'L', value: 20 },
  { label: 'XL', value: 24 },
];

// Languages organized by region groups
const LANGUAGE_GROUPS = [
  {
    title: 'AU Integrated Languages',
    languages: [
      { code: 'en', name: 'English' },
      { code: 'sw', name: 'Kiswahili' },
      { code: 'ar', name: 'Arabic' },
    ],
  },
  {
    title: 'EU Integrated Languages',
    languages: [
      { code: 'fr', name: 'French' },
      { code: 'es', name: 'Spanish' },
      { code: 'de', name: 'German' },
      { code: 'pt', name: 'Portuguese' },
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

const TopBar = () => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { t } = useTranslation();

  const [language, setLanguage] = useState('en');
  const [fontSize, setFontSize] = useState(16);
  const [langAnchor, setLangAnchor] = useState(null);
  const [fontAnchor, setFontAnchor] = useState(null);

  useEffect(() => {
    setLanguage(i18n.language?.split('-')[0] || 'en');
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === language);
  const currentSize = FONT_SIZES.find((f) => f.value === fontSize);

  const handleFontSize = (value) => {
    setFontSize(value);
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${value}px`;
    }
    setFontAnchor(null);
  };

  const handleLangSelect = (code) => {
    setLanguage(code);
    i18n.changeLanguage(code);
    // Save language preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18nextLng', code);
    }
    setLangAnchor(null);
  };

  const isDark = theme.palette.mode === 'dark';

  const barBg = isDark
    ? 'rgba(255,255,255,0.04)'
    : 'rgba(139,108,188,0.06)';

  const controlSx = {
    height: 24,
    borderRadius: '4px',
    textTransform: 'none',
    fontSize: '0.75rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    px: 1,
    minWidth: 'auto',
    '&:hover': {
      backgroundColor: isDark
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(139,108,188,0.12)',
      color: theme.palette.primary.main,
    },
  };

  return (
    <>
      <Box
        component="div"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: TOPBAR_HEIGHT,
          zIndex: (t) => t.zIndex.appBar + 1,
          backgroundColor: barBg,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: 2,
          gap: 0.5,
        }}
      >
        {/* ── 1. Language ── */}
        <Button
          size="small"
          endIcon={<ArrowDownIcon sx={{ fontSize: '14px !important' }} />}
          onClick={(e) => setLangAnchor(e.currentTarget)}
          sx={controlSx}
          aria-haspopup="true"
          aria-label="Select language"
        >
          {currentLang?.name ?? 'English'}
        </Button>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        {/* ── 2. Dark / Light toggle ── */}
        <Tooltip title={isDarkMode ? t('topbar.light_mode') : t('topbar.dark_mode')} placement="bottom">
          <IconButton
            size="small"
            onClick={toggleTheme}
            sx={{ ...controlSx, px: 0.5, width: 28 }}
            aria-label="Toggle theme"
          >
            {isDarkMode
              ? <LightModeIcon sx={{ fontSize: 15 }} />
              : <DarkModeIcon sx={{ fontSize: 15 }} />}
          </IconButton>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        {/* ── 3. Font size ── */}
        <Tooltip title={t('topbar.font_size')} placement="bottom">
          <Button
            size="small"
            startIcon={<TextFieldsIcon sx={{ fontSize: '13px !important' }} />}
            endIcon={<ArrowDownIcon sx={{ fontSize: '13px !important' }} />}
            onClick={(e) => setFontAnchor(e.currentTarget)}
            sx={controlSx}
            aria-label="Font size"
            aria-haspopup="true"
          >
            {currentSize?.label ?? 'M'}
          </Button>
        </Tooltip>
      </Box>

      {/* ── Language menu ── */}
      <Menu
        anchorEl={langAnchor}
        open={Boolean(langAnchor)}
        onClose={() => setLangAnchor(null)}
        disableScrollLock
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            minWidth: 340,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
          <Typography variant="caption" color="text.disabled" fontWeight={700} letterSpacing="0.08em">
            {t('topbar.language').toUpperCase()}
          </Typography>
        </Box>
        <Divider />
        {LANGUAGE_GROUPS.map((group, groupIndex) => (
          <Box key={group.title}>
            <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {group.title}
              </Typography>
            </Box>
            {group.languages ? (
              <Grid container sx={{ px: 1, pb: groupIndex < LANGUAGE_GROUPS.length - 1 ? 1 : 0.5 }}>
                {group.languages.map((lang) => (
                  <Grid item xs={6} key={lang.code}>
                    <MenuItem
                      selected={language === lang.code}
                      onClick={() => handleLangSelect(lang.code)}
                      sx={{
                        fontSize: '0.875rem',
                        py: 0.9,
                        borderRadius: 1,
                        mx: 0.5,
                        '&.Mui-selected': {
                          backgroundColor: 'rgba(139,108,188,0.1)',
                          fontWeight: 700,
                          color: theme.palette.primary.main,
                        },
                        '&:hover': { backgroundColor: 'rgba(139,108,188,0.08)' },
                      }}
                    >
                      {lang.name}
                    </MenuItem>
                  </Grid>
                ))}
              </Grid>
            ) : (
              group.subgroups.map((subgroup, subIndex) => (
                <Grid container key={subIndex} sx={{ px: 1, pb: subIndex < group.subgroups.length - 1 ? 1 : 0.5 }}>
                  {subgroup.languages.map((lang) => (
                    <Grid item xs={6} key={lang.code}>
                      <MenuItem
                        selected={language === lang.code}
                        onClick={() => handleLangSelect(lang.code)}
                        sx={{
                          fontSize: '0.875rem',
                          py: 0.9,
                          borderRadius: 1,
                          mx: 0.5,
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(139,108,188,0.1)',
                            fontWeight: 700,
                            color: theme.palette.primary.main,
                          },
                          '&:hover': { backgroundColor: 'rgba(139,108,188,0.08)' },
                        }}
                      >
                        {lang.name}
                      </MenuItem>
                    </Grid>
                  ))}
                </Grid>
              ))
            )}
            {groupIndex < LANGUAGE_GROUPS.length - 1 && <Divider sx={{ my: 0.5 }} />}
          </Box>
        ))}
      </Menu>

      {/* ── Font size popover ── */}
      <Popover
        open={Boolean(fontAnchor)}
        anchorEl={fontAnchor}
        onClose={() => setFontAnchor(null)}
        disableScrollLock
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 0.5,
            p: 1.5,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Typography
          variant="caption"
          color="text.disabled"
          fontWeight={700}
          letterSpacing="0.08em"
          sx={{ display: 'block', mb: 1 }}
        >
          {t('topbar.font_size').toUpperCase()}
        </Typography>
        <ButtonGroup size="small" variant="outlined" aria-label="Font size">
          {FONT_SIZES.map(({ label, value }) => (
            <Button
              key={value}
              onClick={() => handleFontSize(value)}
              variant={fontSize === value ? 'contained' : 'outlined'}
              color="primary"
              sx={{
                minWidth: 42,
                fontWeight: fontSize === value ? 700 : 400,
                fontSize: '0.8rem',
              }}
              aria-pressed={fontSize === value}
            >
              {label}
            </Button>
          ))}
        </ButtonGroup>
      </Popover>
    </>
  );
};

export default TopBar;
