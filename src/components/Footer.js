'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();

  const quickLinks = [
    { name: 'About Us', href: '#' },
    { name: 'Features', href: '#' },
    { name: 'Documentation', href: '#' },
    { name: 'API Reference', href: '#' },
    { name: 'Contact', href: '#' },
  ];

  const supportLinks = [
    { name: 'Help Center', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Data Security', href: '#' },
  ];

  const socialLinks = [
    { icon: <TwitterIcon />, name: 'Twitter', url: '#' },
    { icon: <LinkedInIcon />, name: 'LinkedIn', url: '#' },
    { icon: <GitHubIcon />, name: 'GitHub', url: '#' },
    { icon: <EmailIcon />, name: 'Email', url: '#' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.custom?.footerBg || '#2C2E3F',
        color: 'white',
        pt: 8,
        pb: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
            justifyContent: 'space-between',
          }}
        >
          {/* Quick Links */}
          <Box sx={{ flex: '1 1 200px' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                color: 'white',
              }}
            >
              Quick Links
            </Typography>
            <Box>
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  sx={{
                    display: 'block',
                    color: '#a0aec0',
                    textDecoration: 'none',
                    mb: 1,
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      textDecoration: 'underline',
                    },
                    transition: 'color 0.3s ease',
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </Box>
          </Box>

          {/* Support & Legal */}
          <Box sx={{ flex: '1 1 200px' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                color: 'white',
              }}
            >
              Support & Legal
            </Typography>
            <Box>
              {supportLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  sx={{
                    display: 'block',
                    color: '#a0aec0',
                    textDecoration: 'none',
                    mb: 1,
                    fontSize: '0.9rem',
                    '&:hover': {
                      color: theme.palette.primary.light,
                      textDecoration: 'underline',
                    },
                    transition: 'color 0.3s ease',
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </Box>
          </Box>

          {/* Company Info */}
          <Box sx={{ flex: '1 1 300px' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                color: 'white',
              }}
            >
              Hospitium RIS
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                color: '#a0aec0',
                lineHeight: 1.6,
              }}
            >
              Empowering researchers with comprehensive tools for managing research activities, collaborations, and academic workflows.
            </Typography>

            {/* Social Links */}
            <Box>
              {socialLinks.map((social) => (
                <IconButton
                  key={social.name}
                  href={social.url}
                  sx={{
                    color: '#a0aec0',
                    mr: 1,
                    '&:hover': {
                      color: theme.palette.primary.main,
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Bottom Section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: '#a0aec0',
              mb: { xs: 2, sm: 0 },
            }}
          >
            © 2025 Hospitium RIS. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Link
              href="#"
              sx={{
                color: '#a0aec0',
                textDecoration: 'none',
                fontSize: '0.9rem',
                '&:hover': {
                  color: 'white',
                  textDecoration: 'underline',
                },
              }}
            >
              Sitemap
            </Link>
            <Link
              href="#"
              sx={{
                color: '#a0aec0',
                textDecoration: 'none',
                fontSize: '0.9rem',
                '&:hover': {
                  color: 'white',
                  textDecoration: 'underline',
                },
              }}
            >
              Accessibility
            </Link>
            <Link
              href="#"
              sx={{
                color: '#a0aec0',
                textDecoration: 'none',
                fontSize: '0.9rem',
                '&:hover': {
                  color: 'white',
                  textDecoration: 'underline',
                },
              }}
            >
              Cookie Settings
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 