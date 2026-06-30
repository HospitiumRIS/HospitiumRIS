'use client';

import React, { useMemo } from "react";
import Link from 'next/link';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { keyframes } from '@mui/system';
import Container from "@mui/material/Container";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TaskIcon from '@mui/icons-material/Task';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SecurityIcon from '@mui/icons-material/Security';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { styled, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

// Define animation
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const StyledFeatureBox = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(42, 42, 74, 0.8)' 
    : theme.palette.background.paper,
  padding: '40px 30px',
  textAlign: 'center',
  borderRadius: '16px',
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(157, 127, 212, 0.2)' : 'rgba(139, 108, 188, 0.1)'}`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backdropFilter: theme.palette.mode === 'dark' ? 'blur(10px)' : 'none',
  '&:hover': {
    transform: 'translateY(-8px)',
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(52, 52, 84, 0.9)' 
      : theme.palette.background.paper,
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 20px 40px rgba(20, 20, 40, 0.6), 0 0 30px rgba(157, 127, 212, 0.1)' 
      : '0 20px 40px rgba(139, 108, 188, 0.15)',
    borderColor: theme.palette.mode === 'dark' 
      ? 'rgba(157, 127, 212, 0.4)' 
      : 'rgba(139, 108, 188, 0.3)',
    '& .feature-icon': {
      transform: 'scale(1.1)',
      color: theme.palette.primary.main,
    },
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: '70px',
  height: '70px',
  borderRadius: '20px',
  backgroundColor: theme.palette.mode === 'dark' 
    ? `rgba(157, 127, 212, 0.2)` 
    : 'rgba(139, 108, 188, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '24px',
  transition: 'all 0.3s ease-in-out',
  border: theme.palette.mode === 'dark' 
    ? `1px solid rgba(157, 127, 212, 0.1)` 
    : 'none',
  '& svg': {
    fontSize: '32px',
    color: theme.palette.mode === 'dark' 
      ? theme.palette.primary.light 
      : theme.palette.primary.main,
    transition: 'all 0.3s ease-in-out',
  },
}));

const KeyFeatures = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();

  const featuresData = useMemo(() => [
    {
      icon: <AccountCircleIcon />,
      title: t('features.researcher_profiles_title'),
      description: t('features.researcher_profiles_desc'),
      highlights: [
        t('features.researcher_profiles_h1'),
        t('features.researcher_profiles_h2'),
        t('features.researcher_profiles_h3'),
      ],
    },
    {
      icon: <TaskIcon />,
      title: t('features.project_mgmt_title'),
      description: t('features.project_mgmt_desc'),
      highlights: [
        t('features.project_mgmt_h1'),
        t('features.project_mgmt_h2'),
        t('features.project_mgmt_h3'),
      ],
    },
    {
      icon: <MenuBookIcon />,
      title: t('features.publishing_title'),
      description: t('features.publishing_desc'),
      highlights: [
        t('features.publishing_h1'),
        t('features.publishing_h2'),
        t('features.publishing_h3'),
      ],
    },
    {
      icon: <AutoAwesomeIcon />,
      title: t('features.ai_title'),
      description: t('features.ai_desc'),
      highlights: [
        t('features.ai_h1'),
        t('features.ai_h2'),
        t('features.ai_h3'),
      ],
    },
    {
      icon: <SecurityIcon />,
      title: t('features.compliance_title'),
      description: t('features.compliance_desc'),
      highlights: [
        t('features.compliance_h1'),
        t('features.compliance_h2'),
        t('features.compliance_h3'),
      ],
    },
    {
      icon: <GroupsIcon />,
      title: t('features.pid_title'),
      description: t('features.pid_desc'),
      highlights: [
        t('features.pid_h1'),
        t('features.pid_h2'),
        t('features.pid_h3'),
      ],
      link: '/docs/hospitiumris_pid_Integration_framework.html',
    },
  ], [t, i18n.language]);

  return (
    <Box 
      sx={{ 
        py: { xs: 8, md: 12 },
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'transparent' 
          : 'rgba(139, 108, 188, 0.03)',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(42, 42, 74, 0.1) 0%, rgba(52, 52, 84, 0.05) 100%)'
          : undefined,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography 
            variant="h2" 
            component="h2" 
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: theme.palette.text.primary,
            }}
          >
            {t('features.heading')}
          </Typography>
          <Typography 
            variant="h5" 
            color="text.secondary"
            sx={{ 
              maxWidth: '800px',
              mx: 'auto',
              mb: 1,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
            }}
          >
            {t('features.subheading')}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'center',
          }}
        >
          {featuresData.map((feature, index) => (
            <Box
              key={feature.title}
              sx={{
                flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.333% - 16px)' },
                maxWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
                animation: `${fadeInUp} 0.5s ease-out forwards`,
                animationDelay: `${index * 0.1}s`,
                opacity: 0,
              }}
            >
              <StyledFeatureBox>
                <IconWrapper className="feature-icon">
                  {feature.icon}
                </IconWrapper>
                <Typography 
                  variant="h5" 
                  component="h3" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    mb: 2,
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {feature.description}
                </Typography>
                <Box 
                  sx={{ 
                    mt: 'auto',
                    width: '100%',
                    borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(157, 127, 212, 0.15)' : 'rgba(139, 108, 188, 0.1)'}`,
                    pt: 2,
                  }}
                >
                  {feature.highlights.map((highlight, i) => (
                    <Typography 
                      key={i}
                      variant="body2" 
                      sx={{ 
                        color: theme.palette.text.secondary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      • {highlight}
                    </Typography>
                  ))}
                  {feature.link && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        component="a"
                        href={feature.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        endIcon={<OpenInNewIcon />}
                        sx={{
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(157, 127, 212, 0.4)' : 'rgba(139, 108, 188, 0.3)',
                          color: theme.palette.primary.main,
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(157, 127, 212, 0.1)' : 'rgba(139, 108, 188, 0.05)',
                          },
                        }}
                      >
                        {t('hero.cta_learn')}
                      </Button>
                    </Box>
                  )}
                </Box>
              </StyledFeatureBox>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default KeyFeatures; 