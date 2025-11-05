'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider,
  useTheme,
  TextField,
  Button,
  Stack,
} from '@mui/material';
import {
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  GitHub as GitHubIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();
  const [email, setEmail] = useState('');

  const handleSubscribe = () => {
    console.log('Subscribe with email:', email);
    // Add subscription logic here
    setEmail('');
  };

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
    { name: 'Security', href: '#' },
    { name: 'Blog', href: '#' },
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
        <Grid container spacing={4}>
          {/* Newsletter Section */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                color: 'white',
              }}
            >
              Stay Updated
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                color: '#a0aec0',
                lineHeight: 1.6,
              }}
            >
              Subscribe to our newsletter for the latest updates, research news, and community highlights.
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              <TextField
                placeholder="Enter your email"
                variant="outlined"
                size="small"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#a0aec0',
                    opacity: 1,
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={handleSubscribe}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  px: 3,
                }}
              >
                Subscribe
              </Button>
            </Stack>
          </Grid>

          {/* Quick Links */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
          </Grid>

          {/* Support & Legal */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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
          </Grid>

          {/* Company Info */}
          <Grid size={{ xs: 12, md: 5 }}>
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
          </Grid>
        </Grid>

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