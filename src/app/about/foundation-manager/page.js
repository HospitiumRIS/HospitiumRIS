'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const PURPLE = '#8b6cbc';

const FeatureCard = ({ title, intro, items, label, highlights, theme }) => (
  <Paper
    elevation={0}
    sx={{
      flex: '1 1 calc(50% - 16px)',
      minWidth: { xs: '100%', md: 'calc(50% - 16px)' },
      p: { xs: 3, md: 4 },
      borderLeft: `4px solid ${PURPLE}`,
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.02)',
    }}
  >
    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: PURPLE }}>
      {title}
    </Typography>
    <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
      {intro}
    </Typography>
    {items.length > 0 && (
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        {items.map((item, index) => (
          <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
            {item}
          </Typography>
        ))}
      </Box>
    )}
    <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
      {label}
    </Typography>
    <Box component="ul" sx={{ pl: 3 }}>
      {highlights.map((item, index) => (
        <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5, fontStyle: 'italic', color: theme.palette.text.secondary }}>
          {item}
        </Typography>
      ))}
    </Box>
  </Paper>
);

const FoundationManagerPage = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const ns = 'about_foundation_manager';

  const features = useMemo(() => [
    {
      title: t(`${ns}.f1_title`),
      intro: t(`${ns}.f1_intro`),
      items: [t(`${ns}.f1_item1`), t(`${ns}.f1_item2`), t(`${ns}.f1_item3`), t(`${ns}.f1_item4`)],
      label: t(`${ns}.f1_why_label`),
      highlights: [t(`${ns}.f1_why1`), t(`${ns}.f1_why2`)],
    },
    {
      title: t(`${ns}.f2_title`),
      intro: t(`${ns}.f2_intro`),
      items: [],
      label: t(`${ns}.f2_value_label`),
      highlights: [t(`${ns}.f2_value1`), t(`${ns}.f2_value2`), t(`${ns}.f2_value3`)],
    },
    {
      title: t(`${ns}.f3_title`),
      intro: t(`${ns}.f3_intro`),
      items: [t(`${ns}.f3_item1`), t(`${ns}.f3_item2`), t(`${ns}.f3_item3`), t(`${ns}.f3_item4`)],
      label: t(`${ns}.f3_why_label`),
      highlights: [t(`${ns}.f3_why1`), t(`${ns}.f3_why2`), t(`${ns}.f3_why3`)],
    },
    {
      title: t(`${ns}.f4_title`),
      intro: t(`${ns}.f4_intro`),
      items: [],
      label: t(`${ns}.f4_advantage_label`),
      highlights: [t(`${ns}.f4_advantage1`), t(`${ns}.f4_advantage2`), t(`${ns}.f4_advantage3`)],
    },
  ], [t, i18n.language]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <Box
        sx={{
          background: PURPLE,
          color: 'white',
          py: { xs: 6, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 3,
              textAlign: 'center',
              fontSize: { xs: '2rem', md: '2.75rem' },
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            {t(`${ns}.hero_title`)}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              textAlign: 'center',
              maxWidth: '900px',
              mx: 'auto',
              opacity: 0.98,
              fontWeight: 400,
              lineHeight: 1.7,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
            }}
          >
            {t(`${ns}.hero_subtitle`)}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 4,
            color: theme.palette.text.primary,
            fontSize: { xs: '1.75rem', md: '2rem' },
          }}
        >
          {t(`${ns}.features_title`)}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} theme={theme} />
          ))}
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            mt: 6,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.1)' : 'rgba(139, 108, 188, 0.05)',
            borderRadius: 4,
            border: '2px solid',
            borderColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.3)' : 'rgba(139, 108, 188, 0.2)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 3,
              textAlign: 'center',
              color: PURPLE,
              fontSize: { xs: '1.75rem', md: '2rem' },
            }}
          >
            {t(`${ns}.conclusion_title`)}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.2rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            {t(`${ns}.conclusion_text`)}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default FoundationManagerPage;
