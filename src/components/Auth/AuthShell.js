'use client';

/**
 * Full-screen split layout shared by the login and register pages:
 * brand hero on the left (desktop only), centred form column on the right.
 * The main navbar is hidden on these routes (see AppNavbar), so the
 * language / theme / font-size controls are shown here as a compact pill.
 */
import React from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import { Box, Typography } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../ThemeProvider';
import TopBar from '../TopBar';
import { formFieldsSx } from '../Registration/FormKit';

const heroBg = [
  // purple wash from the top-left, fading into the artwork
  'linear-gradient(155deg, rgba(139,108,188,0.85) 0%, rgba(106,76,156,0.55) 30%, rgba(39,42,78,0.15) 60%, rgba(39,42,78,0) 75%)',
  // darken the bottom edge
  'linear-gradient(0deg, rgba(24,24,52,0.9) 0%, rgba(24,24,52,0) 45%)',
  // soften the artwork overall so text always wins
  'linear-gradient(rgba(39,42,78,0.35), rgba(39,42,78,0.35))',
  'url(/hero_background.png)',
].join(', ');

const AuthShell = ({ children, maxWidth = 580 }) => {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const { t } = useTranslation();

  const rightBg = theme.palette.mode === 'dark' ? theme.palette.background.default : '#f7f7fa';

  const valueProps = [
    t('auth.register_vp_orcid', 'Import your publications via ORCID'),
    t('auth.register_vp_collab', 'Collaborate on manuscripts in real time'),
    t('auth.register_vp_grants', 'Manage proposals, grants and reviews'),
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(380px, 44%) 1fr', lg: '1fr 1fr' },
        backgroundColor: rightBg,
      }}
    >
      {/* ===== Left: brand hero (desktop) ===== */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          color: '#fff',
          px: { md: 5, lg: 7 },
          py: { md: 4, lg: 5 },
          backgroundColor: '#272a4e',
          backgroundImage: heroBg,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover, cover, cover, auto 46%',
          backgroundPosition: 'center, center, center, right top',
        }}
      >
        <Box component={NextLink} href="/" sx={{ display: 'inline-flex', alignSelf: 'flex-start' }}>
          <Image src="/hospitium-logo-dark.png" alt="Hospitium RIS" width={160} height={36} priority />
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 560, py: 4 }}>
          <Typography
            component="p"
            sx={{
              fontWeight: 700,
              fontSize: { md: '2.25rem', lg: '2.75rem', xl: '3.125rem' },
              lineHeight: 1.12,
              letterSpacing: '-0.025em',
              mb: 2.5,
              textShadow: '0 2px 24px rgba(0,0,0,0.25)',
            }}
          >
            {t('auth.register_hero_title', 'Empowering health research, from idea to impact')}
          </Typography>
          <Typography sx={{ fontSize: { md: '1rem', lg: '1.0625rem' }, lineHeight: 1.65, opacity: 0.85, mb: 4, maxWidth: 500 }}>
            {t('auth.register_hero_subtitle', 'Manage publications, proposals, ethics reviews and funding in one secure platform built for hospitals and research institutions.')}
          </Typography>

          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {valueProps.map((text) => (
              <Box component="li" key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    display: 'grid', placeItems: 'center',
                    border: '1.5px solid rgba(255,255,255,0.6)',
                  }}
                >
                  <CheckIcon sx={{ fontSize: 13 }} />
                </Box>
                <Typography sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>{text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ===== Right: form ===== */}
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 2, md: 3 } }}>
          <Box component={NextLink} href="/" sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
            <Image
              src={isDarkMode ? '/hospitium-logo-dark.png' : '/hospitium-logo.png'}
              alt="Hospitium RIS"
              width={130}
              height={29}
              priority
            />
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <TopBar inline />
          </Box>
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', px: { xs: 2.5, sm: 4 }, py: { xs: 3, md: 4 } }}>
          <Box sx={{ width: '100%', maxWidth, mx: 'auto', my: 'auto', ...formFieldsSx(theme) }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthShell;
