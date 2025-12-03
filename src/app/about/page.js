'use client';

import React from 'react';
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
      icon: <TrendingUpIcon sx={{ fontSize: 50, color: '#00BFA5' }} />,
      description: 'Oversee institutional research activities, manage workflows, and monitor research output with comprehensive analytics dashboards.',
    },
    {
      title: 'Researchers',
      icon: <ScienceIcon sx={{ fontSize: 50, color: '#7B1FA2' }} />,
      description: 'Manage publications, conduct research, and ensure compliance & approvals through an integrated researcher portal.',
      features: ['Publications', 'Research', 'Compliance & Approvals'],
    },
    {
      title: 'Foundation Manager',
      icon: <AccountBalanceIcon sx={{ fontSize: 50, color: '#1976D2' }} />,
      description: 'Coordinate grants, manage fundraising teams, and track the impact of research investments.',
      features: ['Grants', 'Fundraising Teams'],
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
          background: '#8b6cbc',
          color: 'white',
          py: 12,
                    position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              textAlign: 'center',
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            About HospitiumRIS
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              textAlign: 'center',
              mb: 3,
              fontStyle: 'italic',
              opacity: 0.9,
              letterSpacing: 1,
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
              opacity: 0.95,
              fontWeight: 400,
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
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
              mt: 2,
              opacity: 0.9,
              fontSize: { xs: '1rem', md: '1.1rem' },
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
            p: 6,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 191, 165, 0.05)' : 'rgba(0, 191, 165, 0.03)',
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
              color: '#8b6cbc',
            }}
          >
            What is HospitiumRIS?
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
              mb: 4,
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
              fontWeight: 600,
              mb: 3,
              textAlign: 'center',
              color: '#8b6cbc',
            }}
          >
            Core Purpose
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
            To strengthen hospitals&apos; capacity to manage funding, clinical studies—conduct, manage, and 
            showcase research, ensuring compliance, visibility, and efficiency from proposal to publication.
          </Typography>
        </Paper>
      </Container>

      {/* Strategic Benefits Section */}
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
              mb: 2,
              textAlign: 'center',
              color: theme.palette.text.primary,
            }}
          >
            Benefits & Impact
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              mb: 6,
              textAlign: 'center',
              color: theme.palette.text.secondary,
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
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  borderTop: '4px solid',
                  borderTopColor: index % 3 === 0 ? '#00BFA5' : index % 3 === 1 ? '#7B1FA2' : '#1976D2',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ mb: 2 }}>{benefit.icon}</Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: theme.palette.text.primary,
                    }}
                  >
                    {benefit.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.palette.text.secondary,
                      lineHeight: 1.7,
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
            <Paper
              key={index}
              sx={{
                flex: '1 1 300px',
                maxWidth: '400px',
                p: 4,
                textAlign: 'center',
                border: '2px solid',
                borderColor: index === 0 ? '#00BFA5' : index === 1 ? '#7B1FA2' : '#1976D2',
                borderRadius: 3,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[6],
                },
              }}
            >
              {role.icon}
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 1 }}>
                {role.title}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, mb: 2 }}>
                {role.description}
              </Typography>
              {role.features && (
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                  {role.features.map((feature, idx) => (
                    <Chip
                      key={idx}
                      label={feature}
                      size="small"
                      sx={{
                        backgroundColor: index === 0 ? 'rgba(0, 191, 165, 0.1)' : index === 1 ? 'rgba(123, 31, 162, 0.1)' : 'rgba(25, 118, 210, 0.1)',
                        color: index === 0 ? '#00BFA5' : index === 1 ? '#7B1FA2' : '#1976D2',
                        fontWeight: 500,
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Paper>
          ))}
        </Box>
      </Container>


      {/* Developed By Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: 6,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(123, 31, 162, 0.05)' : 'rgba(123, 31, 162, 0.03)',
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
              color: '#8b6cbc',
            }}
          >
            Developed By
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
              mb: 4,
            }}
          >
            <strong>Training Centre in Communication - Africa (TCC-Africa)</strong>, in collaboration with 
            African research institutions, open infrastructure partners, and funders.
          </Typography>
         
        
        </Paper>
      </Container>
    </Box>
  );
};

export default AboutPage;

