'use client';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  useTheme,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const ARTICLE_SLUG = 'tcc_africa_introduces_hospitiumris';

const NewsPage = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  const newsArticles = useMemo(
    () => [
      {
        id: 1,
        title: t(`news_page.articles.${ARTICLE_SLUG}.title`),
        excerpt: t(`news_page.articles.${ARTICLE_SLUG}.excerpt`),
        date: '2025-01-10',
        author: t(`news_page.articles.${ARTICLE_SLUG}.author`),
        category: t(`news_page.articles.${ARTICLE_SLUG}.category`),
        image: '/hospitium-logo.png',
        slug: '/news/tcc-africa-introduces-hospitiumris',
      },
    ],
    [t, i18n.language]
  );

  const dateLocale = i18n.language?.startsWith('sw')
    ? 'sw-KE'
    : i18n.language?.startsWith('ar')
      ? 'ar-SA'
      : i18n.language?.startsWith('fr')
        ? 'fr-FR'
        : i18n.language?.startsWith('es')
          ? 'es-ES'
          : i18n.language?.startsWith('de')
            ? 'de-DE'
            : i18n.language?.startsWith('pt')
              ? 'pt-PT'
              : i18n.language?.startsWith('id')
                ? 'id-ID'
                : i18n.language?.startsWith('ms')
                  ? 'ms-MY'
                  : i18n.language?.startsWith('km')
                    ? 'km-KH'
                    : i18n.language?.startsWith('hi')
                      ? 'hi-IN'
                      : i18n.language?.startsWith('vi')
                        ? 'vi-VN'
                        : i18n.language?.startsWith('lo')
                          ? 'lo-LA'
                          : i18n.language?.startsWith('zh')
                            ? 'zh-CN'
                            : i18n.language?.startsWith('fil')
                              ? 'fil-PH'
                              : i18n.language?.startsWith('th')
                                ? 'th-TH'
                                : i18n.language?.startsWith('tet')
                                  ? 'tet-TL'
                                  : i18n.language?.startsWith('ko')
                                    ? 'ko-KR'
                                    : i18n.language?.startsWith('my')
                                      ? 'my-MM'
                                      : i18n.language || 'en';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        pt: 12,
        pb: 8,
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: theme.palette.text.primary,
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            {t('news_page.title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            {t('news_page.subtitle')}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            justifyContent: 'flex-start',
          }}
        >
          {newsArticles.map((article) => (
            <Box
              key={article.id}
              sx={{
                flex: {
                  xs: '1 1 100%',
                  sm: '1 1 calc(50% - 16px)',
                  md: '0 0 calc(33.333% - 22px)',
                },
                maxWidth: {
                  xs: '100%',
                  sm: 'calc(50% - 16px)',
                  md: 'calc(33.333% - 22px)',
                },
                minWidth: 0,
              }}
            >
              <Card
                onClick={() => article.slug && router.push(article.slug)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: article.slug ? 'pointer' : 'default',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <Box
                  sx={{
                    height: 200,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139,108,188,0.12)' : 'rgba(139,108,188,0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    px: 4,
                  }}
                >
                  <Image
                    src={article.image || '/hospitium-logo.png'}
                    alt={article.title}
                    width={260}
                    height={120}
                    style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
                  />
                </Box>
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={article.category}
                      size="small"
                      sx={{
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: theme.palette.text.primary,
                      fontSize: '1.25rem',
                    }}
                  >
                    {article.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      mb: 3,
                      lineHeight: 1.6,
                      flexGrow: 1,
                    }}
                  >
                    {article.excerpt}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      flexWrap: 'wrap',
                      mt: 'auto',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {new Date(article.date).toLocaleDateString(dateLocale, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {article.author}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default NewsPage;
