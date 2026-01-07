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
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Language as WebIcon,
} from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();

  const quickLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Features', href: '#' },
    { name: 'Documentation', href: '/docs/build/index.html' },
    
    
  ];


  const socialLinks = [
    { icon: <TwitterIcon />, name: 'Twitter', url: '#' },
    { icon: <LinkedInIcon />, name: 'LinkedIn', url: '#' },
    { icon: <GitHubIcon />, name: 'GitHub', url: 'https://github.com/HospitiumRIS/HospitiumRIS' },
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

           {/* Company Info */}
           <Box sx={{ flex: '1 1 250px' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                color: 'white',
              }}
            >
              HospitiumRIS
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 3,
                color: '#a0aec0',
                lineHeight: 1.6,
              }}
            >
            Empowering Research
 Excellence Through
 Integrated Digital
 Infrastructure
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


          {/* Contact Us */}
          <Box sx={{ flex: '1 1 280px' }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                color: 'white',
              }}
            >
              Contact Us
            </Typography>
            
            {/* Address */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <LocationIcon sx={{ color: '#a0aec0', fontSize: 18, mr: 1, mt: 0.3 }} />
              <Typography
                variant="body2"
                sx={{
                  color: '#a0aec0',
                  lineHeight: 1.6,
                  fontSize: '0.85rem',
                }}
              >
                Chiromo Campus, University of Nairobi,<br />
                Gecaga Institute Bldg.<br />
                P.O Box 21553-00100, Nairobi-Kenya
              </Typography>
            </Box>

            {/* Phone */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              <PhoneIcon sx={{ color: '#a0aec0', fontSize: 18, mr: 1, mt: 0.3 }} />
              <Box>
                <Link
                  href="tel:+254208086820"
                  sx={{
                    display: 'block',
                    color: '#a0aec0',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    '&:hover': {
                      color: theme.palette.primary.light,
                    },
                  }}
                >
                  +254 (0)20 8086820
                </Link>
                <Link
                  href="tel:+254202697401"
                  sx={{
                    display: 'block',
                    color: '#a0aec0',
                    textDecoration: 'none',
                    fontSize: '0.85rem',
                    '&:hover': {
                      color: theme.palette.primary.light,
                    },
                  }}
                >
                  +254 (0)20 2697401
                </Link>
              </Box>
            </Box>

            {/* Email */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EmailIcon sx={{ color: '#a0aec0', fontSize: 18, mr: 1 }} />
              <Link
                href="mailto:info@tcc-africa.org"
                sx={{
                  color: '#a0aec0',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  '&:hover': {
                    color: theme.palette.primary.light,
                  },
                }}
              >
                info@tcc-africa.org
              </Link>
            </Box>

            {/* Website */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WebIcon sx={{ color: '#a0aec0', fontSize: 18, mr: 1 }} />
              <Link
                href="https://www.tcc-africa.org"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#a0aec0',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  '&:hover': {
                    color: theme.palette.primary.light,
                  },
                }}
              >
                www.tcc-africa.org
              </Link>
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
            © 2025 HospitiumRIS. All rights reserved.
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