'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  ButtonGroup,
  Button,
  Menu,
  MenuItem,
  Tooltip,
  Popover,
  Typography,
  Divider,
  useMediaQuery,
  Grid,
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Translate as TranslateIcon,
  FormatSize as FormatSizeIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../ThemeProvider';
import i18n from '@/lib/i18n';

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

const HOVER_BG = 'rgba(139, 108, 188, 0.1)';

const NavbarSettings = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [fontSize, setFontSize] = useState(16);
  const [language, setLanguage] = useState('en');
  const [langAnchor, setLangAnchor] = useState(null);
  const [fontAnchor, setFontAnchor] = useState(null);

  useEffect(() => {
    setLanguage(i18n.language?.split('-')[0] || 'en');
  }, []);

  const handleFontSize = (value) => {
    setFontSize(value);
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${value}px`;
    }
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

  const iconBtnSx = {
    color: theme.palette.text.primary,
    '&:hover': { backgroundColor: HOVER_BG },
  };

  const currentLang = LANGUAGES.find((l) => l.code === language)?.name ?? 'English';

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Tooltip title={isDarkMode ? t('topbar.switch_light') : t('topbar.switch_dark')}>
        <IconButton onClick={toggleTheme} size="small" sx={iconBtnSx} aria-label={t('settings_drawer.toggle_dark')}>
          {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      {isMobile ? (
        <>
          <Tooltip title={t('topbar.font_size')}>
            <IconButton
              size="small"
              sx={iconBtnSx}
              onClick={(e) => setFontAnchor(e.currentTarget)}
              aria-label={t('topbar.font_size')}
            >
              <FormatSizeIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Popover
            open={Boolean(fontAnchor)}
            anchorEl={fontAnchor}
            onClose={() => setFontAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            disableScrollLock
            PaperProps={{ sx: { p: 1.5, borderRadius: 2 } }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
              {t('topbar.font_size')}
            </Typography>
            <ButtonGroup size="small" variant="outlined" aria-label={t('topbar.font_size')}>
              {FONT_SIZES.map(({ label, value }) => (
                <Button
                  key={value}
                  onClick={() => { handleFontSize(value); setFontAnchor(null); }}
                  variant={fontSize === value ? 'contained' : 'outlined'}
                  color="primary"
                  sx={{ minWidth: 36, fontWeight: fontSize === value ? 700 : 400 }}
                  aria-pressed={fontSize === value}
                >
                  {label}
                </Button>
              ))}
            </ButtonGroup>
          </Popover>
        </>
      ) : (
        <Tooltip title={t('topbar.font_size')}>
          <ButtonGroup size="small" variant="outlined" aria-label={t('topbar.font_size')} sx={{ mx: 0.5 }}>
            {FONT_SIZES.map(({ label, value }) => (
              <Button
                key={value}
                onClick={() => handleFontSize(value)}
                variant={fontSize === value ? 'contained' : 'outlined'}
                color="primary"
                sx={{
                  minWidth: 34,
                  px: 0,
                  fontSize: '0.72rem',
                  fontWeight: fontSize === value ? 700 : 400,
                  lineHeight: 1,
                }}
                aria-pressed={fontSize === value}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
        </Tooltip>
      )}

      <Tooltip title={`${t('topbar.language')}: ${currentLang}`}>
        <IconButton
          size="small"
          sx={iconBtnSx}
          onClick={(e) => setLangAnchor(e.currentTarget)}
          aria-label={t('topbar.language')}
          aria-haspopup="true"
        >
          <TranslateIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={langAnchor}
        open={Boolean(langAnchor)}
        onClose={() => setLangAnchor(null)}
        disableScrollLock
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 340,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
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
                          backgroundColor: 'rgba(139, 108, 188, 0.12)',
                          fontWeight: 700,
                        },
                        '&:hover': { backgroundColor: HOVER_BG },
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
                            backgroundColor: 'rgba(139, 108, 188, 0.12)',
                            fontWeight: 700,
                          },
                          '&:hover': { backgroundColor: HOVER_BG },
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
    </Box>
  );
};

export default NavbarSettings;
