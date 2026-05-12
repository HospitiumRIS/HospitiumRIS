'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  useTheme,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const newsArticles = [
  {
    id: 1,
    title: 'TCC Africa Introduces HospitiumRIS to Strengthen Research Management and Knowledge Preservation in Healthcare Institutions',
    excerpt: 'TCC Africa launches HospitiumRIS, a comprehensive platform designed to strengthen research management and preserve institutional knowledge in healthcare institutions across Africa.',
    date: '2025-01-10',
    author: 'TCC Africa',
    category: 'Press Release',
    image: '/hospitium-logo.png',
    slug: '/news/tcc-africa-introduces-hospitiumris',
  },
];

const NewsPage = () => {
  const theme = useTheme();
  const router = useRouter();

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
            Latest News & Updates
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            Stay informed about the latest developments, features, and announcements from HospitiumRIS
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
                <CardMedia
                  component="div"
                  sx={{
                    height: 200,
                    backgroundColor: theme.palette.primary.light,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      color: 'white',
                      fontWeight: 600,
                    }}
                  >
                    News
                  </Typography>
                </CardMedia>
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
                        {new Date(article.date).toLocaleDateString('en-US', {
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
