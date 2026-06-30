'use client';

import React, { useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const ResearchManagerPage = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  const ns = 'about_research_manager';

  const problemItems = useMemo(() => [
    t(`${ns}.problem_item1`),
    t(`${ns}.problem_item2`),
    t(`${ns}.problem_item3`),
    t(`${ns}.problem_item4`),
  ], [t, i18n.language]);

  const value1Items = useMemo(() => [
    t(`${ns}.value1_item1`),
    t(`${ns}.value1_item2`),
    t(`${ns}.value1_item3`),
    t(`${ns}.value1_item4`),
  ], [t, i18n.language]);

  const value2Items = useMemo(() => [
    t(`${ns}.value2_item1`),
    t(`${ns}.value2_item2`),
    t(`${ns}.value2_item3`),
  ], [t, i18n.language]);

  const value3Items = useMemo(() => [
    t(`${ns}.value3_item1`),
    t(`${ns}.value3_item2`),
    t(`${ns}.value3_item3`),
  ], [t, i18n.language]);

  const value4Items = useMemo(() => [
    t(`${ns}.value4_item1`),
    t(`${ns}.value4_item2`),
    t(`${ns}.value4_item3`),
  ], [t, i18n.language]);

  const value5Items = useMemo(() => [
    t(`${ns}.value5_item1`),
    t(`${ns}.value5_item2`),
    t(`${ns}.value5_item3`),
  ], [t, i18n.language]);

  const value6Items = useMemo(() => [
    t(`${ns}.value6_item1`),
    t(`${ns}.value6_item2`),
    t(`${ns}.value6_item3`),
  ], [t, i18n.language]);

  const conclusionItems = useMemo(() => [
    t(`${ns}.conclusion_item1`),
    t(`${ns}.conclusion_item2`),
    t(`${ns}.conclusion_item3`),
    t(`${ns}.conclusion_item4`),
  ], [t, i18n.language]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: '#8b6cbc',
          color: 'white',
          py: { xs: 6, md: 8 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
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

      {/* Value Proposition Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
      

        {/* Problem Statement */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: theme.palette.text.primary,
              fontSize: { xs: '1.75rem', md: '2rem' },
            }}
          >
            {t(`${ns}.problem_title`)}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.05rem', md: '1.125rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              mb: 2,
            }}
          >
            {t(`${ns}.problem_intro`)}
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            {problemItems.map((item, index) => (
              <Typography
                component="li"
                key={index}
                sx={{
                  fontSize: { xs: '1.05rem', md: '1.125rem' },
                  lineHeight: 1.9,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                {item}
              </Typography>
            ))}
          </Box>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.05rem', md: '1.125rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              fontWeight: 500,
            }}
          >
            {t(`${ns}.problem_conclusion`)}
          </Typography>
        </Box>

        {/* Core Values */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 4,
            color: theme.palette.text.primary,
            fontSize: { xs: '1.75rem', md: '2rem' },
          }}
        >
          {t(`${ns}.core_value_title`)}
        </Typography>

        {/* Value Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {/* Value 1 */}
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 calc(50% - 16px)',
              minWidth: { xs: '100%', md: 'calc(50% - 16px)' },
              p: { xs: 3, md: 4 },
              borderLeft: '4px solid #8b6cbc',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.02)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>
              {t(`${ns}.value1_title`)}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              {t(`${ns}.value1_intro`)}
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {value1Items.map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              {t(`${ns}.value1_footer`)}
            </Typography>
          </Paper>

          {/* Value 2 */}
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 calc(50% - 16px)',
              minWidth: { xs: '100%', md: 'calc(50% - 16px)' },
              p: { xs: 3, md: 4 },
              borderLeft: '4px solid #8b6cbc',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.02)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>
              {t(`${ns}.value2_title`)}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              {t(`${ns}.value2_intro`)}
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {value2Items.map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              {t(`${ns}.value2_footer`)}
            </Typography>
          </Paper>

          {/* Value 3 */}
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 calc(50% - 16px)',
              minWidth: { xs: '100%', md: 'calc(50% - 16px)' },
              p: { xs: 3, md: 4 },
              borderLeft: '4px solid #8b6cbc',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.02)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>
              {t(`${ns}.value3_title`)}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              {t(`${ns}.value3_intro`)}
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {value3Items.map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              {t(`${ns}.value3_footer`)}
            </Typography>
          </Paper>

          {/* Value 4 */}
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 calc(50% - 16px)',
              minWidth: { xs: '100%', md: 'calc(50% - 16px)' },
              p: { xs: 3, md: 4 },
              borderLeft: '4px solid #8b6cbc',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.02)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>
              {t(`${ns}.value4_title`)}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              {t(`${ns}.value4_intro`)}
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {value4Items.map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              {t(`${ns}.value4_footer`)}
            </Typography>
          </Paper>

          {/* Value 5 */}
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 calc(50% - 16px)',
              minWidth: { xs: '100%', md: 'calc(50% - 16px)' },
              p: { xs: 3, md: 4 },
              borderLeft: '4px solid #8b6cbc',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.02)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>
              {t(`${ns}.value5_title`)}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              {t(`${ns}.value5_intro`)}
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {value5Items.map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              {t(`${ns}.value5_footer`)}
            </Typography>
          </Paper>

          {/* Value 6 */}
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 calc(50% - 16px)',
              minWidth: { xs: '100%', md: 'calc(50% - 16px)' },
              p: { xs: 3, md: 4 },
              borderLeft: '4px solid #8b6cbc',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.02)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>
              {t(`${ns}.value6_title`)}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              {t(`${ns}.value6_intro`)}
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {value6Items.map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              {t(`${ns}.value6_footer`)}
            </Typography>
          </Paper>
        </Box>

        {/* Conclusion */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            mt: 6,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.1)' : 'rgba(139, 108, 188, 0.05)',
            borderRadius: 4,
            border: `2px solid`,
            borderColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.3)' : 'rgba(139, 108, 188, 0.2)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 3,
              textAlign: 'center',
              color: '#8b6cbc',
              fontSize: { xs: '1.75rem', md: '2rem' },
            }}
          >
            {t(`${ns}.conclusion_title`)}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.05rem', md: '1.125rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              mb: 2,
            }}
          >
            {t(`${ns}.conclusion_intro`)}
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            {conclusionItems.map((item, index) => (
              <Typography
                component="li"
                key={index}
                sx={{
                  fontSize: { xs: '1.05rem', md: '1.125rem' },
                  lineHeight: 1.9,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                {item}
              </Typography>
            ))}
          </Box>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.2rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            {t(`${ns}.conclusion_final`)}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResearchManagerPage;
