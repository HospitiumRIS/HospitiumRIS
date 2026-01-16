'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  useTheme,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import {
  Science as ScienceIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Psychology as InnovationIcon,
  Verified as VerifiedIcon,
  Hub as HubIcon,
  Visibility as VisibilityIcon,
  Analytics as AnalyticsIcon,
  Handshake as HandshakeIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Language as WebIcon,
} from '@mui/icons-material';

const AboutPage = () => {
  const theme = useTheme();

  const strategicBenefits = [
    {
      icon: <HubIcon sx={{ fontSize: 40, color: '#00BFA5' }} />,
      title: 'Streamlined Administration',
      description: 'Streamlined research administration and ethics processes for efficient workflow management.',
    },
    {
      icon: <VisibilityIcon sx={{ fontSize: 40, color: '#7B1FA2' }} />,
      title: 'Institutional Visibility',
      description: 'Improved institutional visibility through integrated researcher profiles and publication tracking.',
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: '#1976D2' }} />,
      title: 'Data-Driven Decisions',
      description: 'Data-driven decision-making using analytics dashboards for informed strategic planning.',
    },
    {
      icon: <HandshakeIcon sx={{ fontSize: 40, color: '#E91E63' }} />,
      title: 'Enhanced Collaboration',
      description: 'Enhanced collaboration with universities, funders, and regulatory bodies across the research ecosystem.',
    },
    {
      icon: <GavelIcon sx={{ fontSize: 40, color: '#FF9800' }} />,
      title: 'Compliance & Governance',
      description: 'Strengthened compliance and governance in clinical and academic research.',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40, color: '#4CAF50' }} />,
      title: 'Secure Platform',
      description: 'Centralized and secure platform enabling seamless coordination between all stakeholders.',
    },
  ];

  const userRoles = [
    {
      title: 'Research Manager',
      icon: <TrendingUpIcon sx={{ fontSize: 50, color: '#8b6cbc' }} />,
      description: 'Oversee institutional research activities, manage workflows, and monitor research output with comprehensive analytics dashboards.',
      href: '/about/research-manager',
    },
    {
      title: 'Researchers',
      icon: <ScienceIcon sx={{ fontSize: 50, color: '#8b6cbc' }} />,
      description: 'Manage publications, conduct research, and ensure compliance & approvals through an integrated researcher portal.',
      
      href: '/about/researchers',
    },
    {
      title: 'Foundation Manager',
      icon: <AccountBalanceIcon sx={{ fontSize: 50, color: '#8b6cbc' }} />,
      description: 'Coordinate grants, manage fundraising teams, and track the impact of research investments.',
     
      href: '/about/foundation-manager',
    },
  ];

  const values = [
    {
      icon: <InnovationIcon sx={{ fontSize: 32 }} />,
      title: 'Innovative',
      description: 'Leveraging cutting-edge technology to transform hospital research management.',
    },
    {
      icon: <HubIcon sx={{ fontSize: 32 }} />,
      title: 'Centralized',
      description: 'One unified platform for the entire research lifecycle from proposal to publication.',
    },
    {
      icon: <VerifiedIcon sx={{ fontSize: 32 }} />,
      title: 'Proactive',
      description: 'Anticipating needs and enabling data-driven research excellence.',
    },
  ];

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
              mb: 2,
              textAlign: 'center',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            About HospitiumRIS
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              textAlign: 'center',
              mb: 4,
              fontStyle: 'italic',
              opacity: 0.95,
              letterSpacing: 2,
              fontSize: { xs: '1rem', md: '1.1rem' },
              fontWeight: 300,
            }}
          >
            Innovative. Centralized. Proactive.
          </Typography>
          <Typography
            variant="h5"
            sx={{
              textAlign: 'center',
              maxWidth: '800px',
              mx: 'auto',
              opacity: 0.98,
              fontWeight: 500,
              lineHeight: 1.6,
              fontSize: { xs: '1.2rem', md: '1.5rem' },
              letterSpacing: '-0.01em',
            }}
          >
            Transforming Hospital Research Management
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              maxWidth: '700px',
              mx: 'auto',
              mt: 3,
              opacity: 0.92,
              fontSize: { xs: '1.05rem', md: '1.15rem' },
              fontWeight: 300,
              lineHeight: 1.7,
            }}
          >
            HospitiumRIS transforms your hospital into a data-driven research hub.
          </Typography>
        </Container>
      </Box>

      {/* What is HospitiumRIS Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 191, 165, 0.05)' : 'rgba(0, 191, 165, 0.03)',
            borderRadius: 4,
            border: `2px solid`,
            borderColor: theme.palette.mode === 'dark' ? 'rgba(0, 191, 165, 0.2)' : 'rgba(0, 191, 165, 0.15)',
            boxShadow: '0 4px 20px rgba(0, 191, 165, 0.08)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(0, 191, 165, 0.15)',
            },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 3,
              textAlign: 'center',
              color: '#8b6cbc',
              fontSize: { xs: '1.75rem', md: '2.125rem' },
              letterSpacing: '-0.01em',
            }}
          >
            What is HospitiumRIS?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.05rem', md: '1.125rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              textAlign: 'center',
              maxWidth: '900px',
              mx: 'auto',
              mb: 4,
              fontWeight: 400,
            }}
          >
            HospitiumRIS (Research Information System) is an integrated digital infrastructure designed to 
            manage, track, and enhance the entire research lifecycle in hospitals and health research institutions.
            It enables seamless coordination between clinicians, researchers, ethics committees, and funders 
            through a centralized and secure platform.
          </Typography>
          
          <Divider sx={{ my: 4 }} />
          
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 3,
              textAlign: 'center',
              color: '#8b6cbc',
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              letterSpacing: '-0.01em',
            }}
          >
            Core Purpose
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.05rem', md: '1.125rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              textAlign: 'center',
              maxWidth: '900px',
              mx: 'auto',
              fontWeight: 400,
            }}
          >
            To strengthen hospitals&apos; capacity to manage funding, clinical studies—conduct, manage, and 
            showcase research, ensuring compliance, visibility, and efficiency from proposal to publication.
          </Typography>
        </Paper>
      </Container>

      {/* Strategic Benefits Section */}
      <Box
        sx={{
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.3) 100%)'
            : 'linear-gradient(180deg, rgba(248, 250, 252, 1) 0%, rgba(241, 245, 249, 1) 100%)',
          py: { xs: 6, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 2,
              textAlign: 'center',
              color: theme.palette.text.primary,
              fontSize: { xs: '1.75rem', md: '2.125rem' },
              letterSpacing: '-0.01em',
            }}
          >
            Benefits & Impact
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              mb: { xs: 4, md: 6 },
              textAlign: 'center',
              color: theme.palette.text.secondary,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
            }}
          >
            Strategic Benefits for Hospitals
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              justifyContent: 'center',
            }}
          >
            {strategicBenefits.map((benefit, index) => (
              <Card
                key={index}
                sx={{
                  flex: '1 1 calc(33.333% - 32px)',
                  minWidth: '280px',
                  maxWidth: '400px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderTop: '4px solid',
                  borderTopColor: index % 3 === 0 ? '#00BFA5' : index % 3 === 1 ? '#7B1FA2' : '#1976D2',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  '&:hover': {
                    transform: 'translateY(-12px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
                    borderTopWidth: '6px',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Box sx={{ mb: 2 }}>{benefit.icon}</Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: theme.palette.text.primary,
                      fontSize: { xs: '1.1rem', md: '1.25rem' },
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {benefit.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.8,
                      fontSize: { xs: '0.95rem', md: '1rem' },
                    }}
                  >
                    {benefit.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Who We Serve Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: { xs: 4, md: 6 },
            textAlign: 'center',
            color: theme.palette.text.primary,
            fontSize: { xs: '1.75rem', md: '2.125rem' },
            letterSpacing: '-0.01em',
          }}
        >
          Who Uses HospitiumRIS?
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'center',
          }}
        >
          {userRoles.map((role, index) => (
            <Link
              key={index}
              href={role.href}
              style={{ textDecoration: 'none', flex: '1 1 300px', maxWidth: '400px' }}
            >
              <Paper
                sx={{
                  height: '100%',
                  p: { xs: 3, md: 4 },
                  textAlign: 'center',
                  border: '3px solid',
                  borderColor: '#8b6cbc',
                  borderRadius: 3,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.9)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    boxShadow: '0 16px 32px rgba(0,0,0,0.12)',
                    borderWidth: '4px',
                  },
                }}
              >
                {role.icon}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, mt: 2, fontSize: { xs: '1.15rem', md: '1.25rem' }, letterSpacing: '-0.01em' }}>
                  {role.title}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.8, mb: 2, fontSize: { xs: '0.95rem', md: '1rem' } }}>
                  {role.description}
                </Typography>
                {role.features && (
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {role.features.map((feature, idx) => (
                      <Chip
                        key={idx}
                        label={feature}
                        size="small"
                        sx={{
                          backgroundColor: 'rgba(139, 108, 188, 0.1)',
                          color: '#8b6cbc',
                          fontWeight: 500,
                        }}
                      />
                    ))}
                  </Stack>
                )}
                <Typography
                  variant="body2"
                  sx={{
                    mt: role.features ? 1 : 2,
                    color: '#8b6cbc',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                  }}
                >
                  Click to read more →
                </Typography>
              </Paper>
            </Link>
          ))}
        </Box>
      </Container>


      {/* Developed By Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(123, 31, 162, 0.05)' : 'rgba(123, 31, 162, 0.03)',
            borderRadius: 4,
            border: `2px solid`,
            borderColor: theme.palette.mode === 'dark' ? 'rgba(123, 31, 162, 0.2)' : 'rgba(123, 31, 162, 0.15)',
            boxShadow: '0 4px 20px rgba(123, 31, 162, 0.08)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 30px rgba(123, 31, 162, 0.15)',
            },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 3,
              textAlign: 'center',
              color: '#8b6cbc',
              fontSize: { xs: '1.75rem', md: '2.125rem' },
              letterSpacing: '-0.01em',
            }}
          >
            Developed By
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.05rem', md: '1.125rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              textAlign: 'center',
              maxWidth: '900px',
              mx: 'auto',
              mb: 4,
              fontWeight: 400,
            }}
          >
            <strong>Training Centre in Communication - Africa (TCC-Africa)</strong>, in collaboration with 
            Hospitals, open infrastructure partners.
          </Typography>
         
        
        </Paper>
      </Container>
    </Box>
  );
};

export default AboutPage;

