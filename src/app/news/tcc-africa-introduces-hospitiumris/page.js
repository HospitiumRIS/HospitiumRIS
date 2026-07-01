'use client';

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Box,
  Divider,
  useTheme,
  Link,
  Tooltip,
  IconButton,
} from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Facebook as FacebookIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

const ARTICLE_URL = 'https://hospitium.hospitiumris.org/news/tcc-africa-introduces-hospitiumris';

const ArticlePage = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

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
  const articleTitle = t('news_page.articles.tcc_africa_introduces_hospitiumris.title');

  const shareItems = useMemo(
    () => [
      {
        label: t('news_page.share_twitter'),
        icon: <TwitterIcon fontSize="small" />,
        href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(ARTICLE_URL)}&text=${encodeURIComponent(t('news_page.share_tweet_text'))}`,
        external: true,
      },
      {
        label: t('news_page.share_linkedin'),
        icon: <LinkedInIcon fontSize="small" />,
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(ARTICLE_URL)}`,
        external: true,
      },
      {
        label: t('news_page.share_facebook'),
        icon: <FacebookIcon fontSize="small" />,
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ARTICLE_URL)}`,
        external: true,
      },
      {
        label: t('news_page.share_email'),
        icon: <EmailIcon fontSize="small" />,
        href: `mailto:?subject=${encodeURIComponent(t('news_page.share_email_subject'))}&body=${encodeURIComponent(t('news_page.share_email_body'))}`,
        external: false,
      },
    ],
    [t, i18n.language]
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        pt: 12,
        pb: 10,
      }}
    >
      <Container maxWidth="md">

        <Box sx={{ mb: 5 }}>
          <Typography
            component="span"
            onClick={() => router.push('/news')}
            sx={{
              fontSize: '0.9rem',
              color: theme.palette.text.secondary,
              cursor: 'pointer',
              letterSpacing: 0.3,
              '&:hover': { color: theme.palette.text.primary },
            }}
          >
            ← {t('news_page.back')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: theme.palette.primary.main,
            }}
          >
            {t('news_page.press_release')}
          </Typography>
          <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: theme.palette.text.disabled }} />
          <Typography
            sx={{
              fontSize: '0.85rem',
              color: theme.palette.text.secondary,
            }}
          >
            {new Date('2025-01-10').toLocaleDateString(dateLocale, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Typography>
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            lineHeight: 1.3,
            mb: 3,
            color: theme.palette.text.primary,
            fontSize: { xs: '1.75rem', md: '2.25rem' },
          }}
        >
          {articleTitle}
        </Typography>

        <Divider sx={{ mb: 5 }} />

        <Box
          sx={{
            '& p': {
              fontSize: '1.05rem',
              lineHeight: 1.9,
              color: theme.palette.text.secondary,
              mb: 3,
            },
          }}
        >
          <Typography component="p">
            {t('news_page.article_tcc.p1_prefix')}
            <Link
              href="https://www.tcc-africa.org/"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ color: theme.palette.primary.main, fontWeight: 500 }}
            >
              {t('news_page.article_tcc.tcc_link')}
            </Link>
            {t('news_page.article_tcc.p1_mid')}
            <Link
              href="https://hospitium.hospitiumris.org/about"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ color: theme.palette.primary.main, fontWeight: 500 }}
            >
              {t('news_page.article_tcc.hospitium_link')}
            </Link>
            {t('news_page.article_tcc.p1_suffix')}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 5,
            }}
          >
            <Image
              src="/docs/img/hospitium-logo.png"
              alt="HospitiumRIS"
              width={520}
              height={130}
              style={{ objectFit: 'contain' }}
              priority
            />
          </Box>

          <Typography component="p">{t('news_page.article_tcc.p2')}</Typography>
          <Typography component="p">{t('news_page.article_tcc.p3')}</Typography>
          <Typography component="p">{t('news_page.article_tcc.p4')}</Typography>
          <Typography component="p">{t('news_page.article_tcc.p5')}</Typography>
          <Typography component="p">{t('news_page.article_tcc.p6')}</Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 5,
            }}
          >
            <Image
              src="/hero.png"
              alt="HospitiumRIS Platform"
              width={720}
              height={400}
              style={{ objectFit: 'cover', borderRadius: 8, width: '100%', height: 'auto' }}
            />
          </Box>

          <Typography component="p">{t('news_page.article_tcc.p7')}</Typography>
          <Typography component="p">{t('news_page.article_tcc.p8')}</Typography>
        </Box>

        <Divider sx={{ mt: 5, mb: 4 }} />

        <Box sx={{ mb: 5 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: theme.palette.text.disabled,
              mb: 2.5,
            }}
          >
            {t('news_page.share_title')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {shareItems.map((item) => (
              <Tooltip key={item.label} title={item.label} arrow>
                <IconButton
                  component="a"
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  size="medium"
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1.5,
                    color: theme.palette.text.secondary,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: theme.palette.text.primary,
                      color: theme.palette.text.primary,
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                >
                  {item.icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 5 }} />

        <Box>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: theme.palette.text.disabled,
              mb: 3,
            }}
          >
            {t('news_page.for_more_info')}
          </Typography>

          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: theme.palette.text.primary,
              mb: 0.5,
            }}
          >
            {t('news_page.pr_team')}
          </Typography>

          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: theme.palette.text.primary,
              mb: 2,
            }}
          >
            {t('news_page.tcc_name')}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
            }}
          >
            <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }}>
              {t('news_page.faculty')}
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }}>
              {t('news_page.building')}
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }}>
              {t('news_page.landline')}{' '}
              <Link href="tel:+254208086820" underline="hover" sx={{ color: 'inherit' }}>
                +254 020 808 6820
              </Link>
              {' '}·{' '}
              <Link href="tel:+254202697401" underline="hover" sx={{ color: 'inherit' }}>
                +254 020 2697401
              </Link>
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }}>
              {t('news_page.email_label')}{' '}
              <Link href="mailto:pr@tcc-africa.org" underline="hover" sx={{ color: theme.palette.primary.main }}>
                pr@tcc-africa.org
              </Link>
              {' '}·{' '}
              <Link href="mailto:info@hospitiumris.org" underline="hover" sx={{ color: theme.palette.primary.main }}>
                info@hospitiumris.org
              </Link>
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }}>
              {t('news_page.website_label')}{' '}
              <Link href="https://www.tcc-africa.org" target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: theme.palette.primary.main }}>
                www.tcc-africa.org
              </Link>
              {' '}·{' '}
              <Link href="https://hospitium.hospitiumris.org/" target="_blank" rel="noopener noreferrer" underline="hover" sx={{ color: theme.palette.primary.main }}>
                hospitium.hospitiumris.org
              </Link>
            </Typography>
          </Box>
        </Box>

      </Container>
    </Box>
  );
};

export default ArticlePage;
