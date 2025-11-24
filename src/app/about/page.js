'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  useTheme,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import {
  Science as ScienceIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  AccountBalance as AccountBalanceIcon,
  Public as PublicIcon,
  Psychology as InnovationIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';

const AboutPage = () => {
  const theme = useTheme();

  const features = [
    {
      icon: <ScienceIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Research Management',
      description: 'Comprehensive tools for managing publications, manuscripts, and collaborative writing projects with version control and track changes.',
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Collaboration Hub',
      description: 'Connect with researchers worldwide, form research networks, and collaborate on projects seamlessly across institutions.',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Analytics & Insights',
      description: 'Track research impact, analyze publication metrics, and gain insights into your research performance and influence.',
    },
    {
      icon: <AccountBalanceIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Grant Management',
      description: 'Streamline proposal submissions, track grant applications, and manage project budgets efficiently.',
    },
    {
      icon: <SchoolIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Institutional Portal',
      description: 'Institutions can monitor research output, manage researchers, and review proposals from a centralized dashboard.',
    },
    {
      icon: <PublicIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />,
      title: 'Foundation Support',
      description: 'Foundations can manage campaigns, track donations, coordinate grant opportunities, and monitor funding impact.',
    },
  ];

  const values = [
    {
      icon: <InnovationIcon sx={{ fontSize: 32 }} />,
      title: 'Innovation',
      description: 'Leveraging cutting-edge technology to advance research management.',
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 32 }} />,
      title: 'Integrity',
      description: 'Maintaining the highest standards of data security and research ethics.',
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 32 }} />,
      title: 'Collaboration',
      description: 'Fostering a global community of researchers and institutions.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          py: 12,
          mt: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 3,
              textAlign: 'center',
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            About HospitiumRIS
          </Typography>
          <Typography
            variant="h5"
            sx={{
              textAlign: 'center',
              maxWidth: '800px',
              mx: 'auto',
              opacity: 0.95,
              fontWeight: 400,
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
            }}
          >
            A comprehensive Research Information System empowering researchers, institutions, and foundations
            to manage, collaborate, and advance scientific discovery.
          </Typography>
        </Container>
      </Box>

      {/* Mission Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: 6,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.03)',
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 3,
              textAlign: 'center',
              color: theme.palette.primary.main,
            }}
          >
            Our Mission
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.1rem',
              lineHeight: 1.8,
              color: theme.palette.text.primary,
              textAlign: 'center',
              maxWidth: '900px',
              mx: 'auto',
            }}
          >
            HospitiumRIS is dedicated to transforming the landscape of research management by providing
            an integrated platform that brings together researchers, institutions, and funding organizations.
            Our mission is to streamline research workflows, enhance collaboration, and accelerate the pace
            of scientific discovery through innovative technology and user-centric design.
          </Typography>
        </Paper>
      </Container>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            mb: 6,
            textAlign: 'center',
            color: theme.palette.text.primary,
          }}
        >
          Key Features
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            justifyContent: 'center',
          }}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              sx={{
                flex: '1 1 calc(33.333% - 32px)',
                minWidth: '280px',
                maxWidth: '400px',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: theme.palette.text.primary,
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                  }}
                >
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Who We Serve Section */}
      <Box
        sx={{
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 6,
              textAlign: 'center',
              color: theme.palette.text.primary,
            }}
          >
            Who We Serve
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              justifyContent: 'center',
            }}
          >
            <Paper
              sx={{
                flex: '1 1 300px',
                maxWidth: '400px',
                p: 4,
                textAlign: 'center',
              }}
            >
              <ScienceIcon sx={{ fontSize: 50, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Researchers
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                Individual researchers can manage publications, collaborate on manuscripts, track research
                impact, submit proposals, and connect with the global research community.
              </Typography>
            </Paper>

            <Paper
              sx={{
                flex: '1 1 300px',
                maxWidth: '400px',
                p: 4,
                textAlign: 'center',
              }}
            >
              <SchoolIcon sx={{ fontSize: 50, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Institutions
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                Academic and research institutions can oversee research activities, manage researcher
                portfolios, review proposals, and analyze institutional research performance.
              </Typography>
            </Paper>

            <Paper
              sx={{
                flex: '1 1 300px',
                maxWidth: '400px',
                p: 4,
                textAlign: 'center',
              }}
            >
              <AccountBalanceIcon sx={{ fontSize: 50, color: theme.palette.primary.main, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Foundations
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                Funding organizations can manage grant opportunities, coordinate fundraising campaigns,
                track donations, and monitor the impact of their research investments.
              </Typography>
            </Paper>
          </Box>
        </Container>
      </Box>

      {/* Core Values */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            mb: 6,
            textAlign: 'center',
            color: theme.palette.text.primary,
          }}
        >
          Our Core Values
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            justifyContent: 'center',
          }}
        >
          {values.map((value, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                flex: '1 1 300px',
                maxWidth: '350px',
                border: `2px solid ${theme.palette.divider}`,
                textAlign: 'center',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box
                  sx={{
                    color: theme.palette.primary.main,
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {value.icon}
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    color: theme.palette.text.primary,
                  }}
                >
                  {value.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    lineHeight: 1.7,
                  }}
                >
                  {value.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* Technology Stack */}
      <Box
        sx={{
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 4,
              textAlign: 'center',
              color: theme.palette.text.primary,
            }}
          >
            Built with Modern Technology
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              mb: 4,
              color: theme.palette.text.secondary,
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            HospitiumRIS is built using cutting-edge technologies to ensure performance, security, and scalability.
          </Typography>
          <Stack
            direction="row"
            spacing={2}
            sx={{
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Chip label="Next.js" sx={{ fontSize: '1rem', py: 2.5, px: 1 }} />
            <Chip label="React" sx={{ fontSize: '1rem', py: 2.5, px: 1 }} />
            <Chip label="Material-UI" sx={{ fontSize: '1rem', py: 2.5, px: 1 }} />
            <Chip label="Prisma" sx={{ fontSize: '1rem', py: 2.5, px: 1 }} />
            <Chip label="PostgreSQL" sx={{ fontSize: '1rem', py: 2.5, px: 1 }} />
            <Chip label="Node.js" sx={{ fontSize: '1rem', py: 2.5, px: 1 }} />
          </Stack>
        </Container>
      </Box>

      {/* Call to Action */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: 6,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
            Join the HospitiumRIS Community
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 4, opacity: 0.95 }}>
            Be part of a growing network of researchers, institutions, and foundations advancing scientific discovery.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'center' }}
          >
            <Box
              component="a"
              href="/register"
              sx={{
                backgroundColor: 'white',
                color: theme.palette.primary.main,
                px: 4,
                py: 1.5,
                borderRadius: 1,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              Get Started
            </Box>
            <Box
              component="a"
              href="/login"
              sx={{
                backgroundColor: 'transparent',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 1,
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-block',
                border: '2px solid white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Login
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default AboutPage;

