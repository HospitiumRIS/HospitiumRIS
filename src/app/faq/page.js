'use client';

import React, { useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Chip,
  List,
  ListItem,
  Link,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpIcon,
  FiberManualRecord as BulletIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const FAQPage = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const faqData = useMemo(() => [
    {
      category: t('faq.cat_overview'),
      questions: [
        { question: t('faq.q1'), answer: t('faq.a1') },
        {
          question: t('faq.q2'),
          answer: t('faq.a2'),
          bullets: t('faq.a2_bullets', { returnObjects: true }),
          footer: t('faq.a2_footer'),
        },
      ],
    },
    {
      category: t('faq.cat_who_can_use'),
      questions: [
        {
          question: t('faq.q3'),
          answer: t('faq.a3'),
          bullets: t('faq.a3_bullets', { returnObjects: true }),
        },
        {
          question: t('faq.q4'),
          answer: t('faq.a4'),
          bullets: t('faq.a4_bullets', { returnObjects: true }),
        },
      ],
    },
    {
      category: t('faq.cat_features'),
      questions: [
        {
          question: t('faq.q5'),
          answer: t('faq.a5'),
          bullets: t('faq.a5_bullets', { returnObjects: true }),
        },
        {
          question: t('faq.q6'),
          answer: t('faq.a6'),
          bullets: t('faq.a6_bullets', { returnObjects: true }),
          footer: t('faq.a6_footer'),
        },
        {
          question: t('faq.q7'),
          answer: t('faq.a7'),
          bullets: t('faq.a7_bullets', { returnObjects: true }),
          footer: t('faq.a7_footer'),
        },
        {
          question: t('faq.q8'),
          answer: t('faq.a8'),
          bullets: t('faq.a8_bullets', { returnObjects: true }),
        },
        {
          question: t('faq.q9'),
          answer: t('faq.a9'),
          bullets: t('faq.a9_bullets', { returnObjects: true }),
        },
        {
          question: t('faq.q10'),
          answer: t('faq.a10'),
          bullets: t('faq.a10_bullets', { returnObjects: true }),
          footer: t('faq.a10_footer'),
        },
        {
          question: t('faq.q11'),
          answer: t('faq.a11'),
          bullets: t('faq.a11_bullets', { returnObjects: true }),
        },
        {
          question: t('faq.q12'),
          answer: t('faq.a12'),
          bullets: t('faq.a12_bullets', { returnObjects: true }),
        },
      ],
    },
    {
      category: t('faq.cat_analytics'),
      questions: [
        {
          question: t('faq.q13'),
          answer: t('faq.a13'),
          bullets: t('faq.a13_bullets', { returnObjects: true }),
        },
        {
          question: t('faq.q14'),
          answer: t('faq.a14'),
          bullets: t('faq.a14_bullets', { returnObjects: true }),
        },
        {
          question: t('faq.q15'),
          answer: t('faq.a15'),
          bullets: t('faq.a15_bullets', { returnObjects: true }),
        },
      ],
    },
    {
      category: t('faq.cat_context'),
      questions: [
        {
          question: t('faq.q16'),
          answer: t('faq.a16'),
          bullets: t('faq.a16_bullets', { returnObjects: true }),
          footer: t('faq.a16_footer'),
        },
        {
          question: t('faq.q17'),
          answer: t('faq.a17'),
          bullets: t('faq.a17_bullets', { returnObjects: true }),
        },
        {
          question: t('faq.q18'),
          answer: t('faq.a18'),
          bullets: t('faq.a18_bullets', { returnObjects: true }),
        },
        { question: t('faq.q19'), answer: t('faq.a19') },
        {
          question: t('faq.q20'),
          answer: t('faq.a20'),
          bullets: t('faq.a20_bullets', { returnObjects: true }),
        },
      ],
    },
    {
      category: t('faq.cat_governance'),
      questions: [
        {
          question: t('faq.q21'),
          answer: t('faq.a21'),
          bullets: t('faq.a21_bullets', { returnObjects: true }),
        },
        {
          question: t('faq.q22'),
          answer: t('faq.a22'),
          bullets: t('faq.a22_bullets', { returnObjects: true }),
          footer: t('faq.a22_footer'),
        },
        {
          question: t('faq.q23'),
          answer: t('faq.a23'),
          bullets: t('faq.a23_bullets', { returnObjects: true }),
        },
        {
          question: t('faq.q24'),
          answer: t('faq.a24'),
          bullets: t('faq.a24_bullets', { returnObjects: true }),
        },
      ],
    },
    {
      category: t('faq.cat_about'),
      questions: [
        {
          question: t('faq.q25'),
          answer: t('faq.a25'),
          bullets: t('faq.a25_bullets', { returnObjects: true }),
        },
        { question: t('faq.q26'), answer: t('faq.a26') },
        {
          question: t('faq.q27'),
          answer: t('faq.a27'),
          bullets: t('faq.a27_bullets', { returnObjects: true }),
        },
      ],
    },
  ], [t, i18n.language]);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const renderAnswer = (faq) => (
    <>
      {faq.answer && (
        <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.8, mb: faq.bullets ? 1 : 0 }}>
          {faq.answer}
        </Typography>
      )}
      {faq.bullets && (
        <List dense disablePadding sx={{ mb: faq.footer ? 1 : 0 }}>
          {faq.bullets.map((bullet, i) => (
            <ListItem key={i} disablePadding sx={{ py: 0.3, alignItems: 'flex-start' }}>
              <BulletIcon sx={{ fontSize: 8, color: theme.palette.primary.main, mr: 1.5, mt: 0.9, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                {bullet}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
      {faq.footer && (
        <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.8, mt: 1 }}>
          {faq.footer}
        </Typography>
      )}
    </>
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #764ba2 0%, #8b6cbc 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              mb: 3,
            }}
          >
            <HelpIcon sx={{ fontSize: 38, color: 'white' }} />
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2.2rem', md: '3.5rem' },
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            {t('faq.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: '700px',
              mx: 'auto',
              opacity: 0.92,
              fontWeight: 300,
              lineHeight: 1.7,
              fontSize: { xs: '1rem', md: '1.2rem' },
            }}
          >
            {t('faq.subtitle')}
          </Typography>
        </Container>
      </Box>

      {/* FAQ Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>

        {faqData.map((category, categoryIndex) => (
          <Box key={categoryIndex} sx={{ mb: 6 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={category.category}
                sx={{
                  backgroundColor: '#8b6cbc',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  px: 1,
                  letterSpacing: '0.02em',
                }}
              />
              <Box sx={{ flexGrow: 1, height: '2px', backgroundColor: theme.palette.divider }} />
            </Box>

            {category.questions.map((faq, faqIndex) => {
              const panelId = `panel-${categoryIndex}-${faqIndex}`;
              return (
                <Accordion
                  key={faqIndex}
                  expanded={expanded === panelId}
                  onChange={handleChange(panelId)}
                  elevation={0}
                  sx={{
                    mb: 1.5,
                    border: `1px solid`,
                    borderColor: expanded === panelId ? '#8b6cbc40' : theme.palette.divider,
                    borderRadius: '8px !important',
                    '&:before': { display: 'none' },
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: expanded === panelId
                      ? '0 4px 20px rgba(139,108,188,0.12)'
                      : '0 1px 4px rgba(0,0,0,0.06)',
                    '&.Mui-expanded': { mt: 0, mb: 1.5 },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: expanded === panelId ? '#8b6cbc' : theme.palette.text.secondary }} />
                    }
                    sx={{
                      borderRadius: '8px',
                      backgroundColor: expanded === panelId
                        ? 'rgba(139,108,188,0.06)'
                        : theme.palette.background.paper,
                      '&:hover': { backgroundColor: 'rgba(139,108,188,0.04)' },
                      transition: 'background-color 0.2s ease',
                      minHeight: 56,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: expanded === panelId ? '#8b6cbc' : theme.palette.text.primary,
                        fontSize: { xs: '0.95rem', md: '1.05rem' },
                        transition: 'color 0.2s ease',
                        pr: 1,
                      }}
                    >
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      px: 3,
                      pb: 3,
                      pt: 0,
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box sx={{ pt: 2 }}>
                      {renderAnswer(faq)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        ))}

        {/* CTA Section */}
        <Box
          sx={{
            mt: 4,
            p: { xs: 4, md: 6 },
            background: 'linear-gradient(135deg, #764ba2 0%, #8b6cbc 100%)',
            borderRadius: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -20, right: -20,
              width: 120, height: 120,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.08)',
            },
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: 'white', position: 'relative', zIndex: 1 }}>
            {t('faq.cta_title')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, position: 'relative', zIndex: 1 }}>
            {t('faq.cta_subtitle')}
          </Typography>
          <Link
            href={`mailto:${t('faq.cta_email')}`}
            sx={{
              display: 'inline-block',
              color: 'white',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              border: '2px solid rgba(255,255,255,0.7)',
              borderRadius: '8px',
              px: 3,
              py: 1.2,
              position: 'relative',
              zIndex: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderColor: 'white',
              },
            }}
          >
            {t('faq.cta_email')}
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default FAQPage;
