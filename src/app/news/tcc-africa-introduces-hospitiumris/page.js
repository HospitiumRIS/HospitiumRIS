'use client';

import React from 'react';
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

const ArticlePage = () => {
  const theme = useTheme();
  const router = useRouter();

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

        {/* Back link */}
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
            ← News
          </Typography>
        </Box>

        {/* Category + Date */}
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
            Press Release
          </Typography>
          <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: theme.palette.text.disabled }} />
          <Typography
            sx={{
              fontSize: '0.85rem',
              color: theme.palette.text.secondary,
            }}
          >
            January 10, 2025
          </Typography>
        </Box>

        {/* Title */}
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
          TCC Africa Introduces HospitiumRIS to Strengthen Research Management and Knowledge Preservation in Healthcare Institutions
        </Typography>

        <Divider sx={{ mb: 5 }} />

        {/* Body */}
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
            The{' '}
            <Link
              href="https://www.tcc-africa.org/"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ color: theme.palette.primary.main, fontWeight: 500 }}
            >
              Training Centre in Communication (TCC Africa)
            </Link>
            {' '}has introduced{' '}
            <Link
              href="https://hospitium.hospitiumris.org/about"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ color: theme.palette.primary.main, fontWeight: 500 }}
            >
              HospitiumRIS
            </Link>
            , an open research information
            and management system designed to support hospitals, healthcare institutions, and clinical research
            environments in organizing, tracking, and managing research activities within a centralized digital
            infrastructure.
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

          <Typography component="p">
            HospitiumRIS is designed to help healthcare and research institutions improve the management of research
            projects, clinical studies, publications, datasets, compliance processes, and institutional knowledge. The
            platform strengthens institutional reporting, research visibility, metadata management, and long-term
            preservation of scholarly and clinical outputs, while supporting research governance, audit readiness, and
            interoperability across global research ecosystems.
          </Typography>

          <Typography component="p">
            As healthcare institutions increasingly generate large volumes of research and clinical data, many continue
            to face challenges related to fragmented research management systems, limited visibility of institutional
            outputs, inconsistent metadata practices, and difficulties in preserving institutional memory over time.
            HospitiumRIS addresses these gaps by providing a unified infrastructure that centralizes research
            administration and knowledge management processes.
          </Typography>

          <Typography component="p">
            The platform enables institutions to manage research projects, protocols, and approvals; conduct
            collaborative academic and project proposal writing; track publications, datasets, clinical studies, and
            grey literature; integrate researcher profiles and affiliations; and support interoperability with global
            Persistent Identifier (PID) systems such as DOIs and ORCIDs.
          </Typography>

          <Typography component="p">
            HospitiumRIS is particularly relevant for teaching and referral hospitals, university hospitals, medical
            research institutes, public health organizations, clinical trial environments, and health research centers
            seeking to strengthen research coordination, compliance, and scholarly visibility.
          </Typography>

          <Typography component="p">
            Conceptually, HospitiumRIS functions as a healthcare-focused Research Information System (RIS),
            integrating research administration, institutional repositories, metadata management, research analytics,
            knowledge preservation, and PID-enabled scholarly infrastructure into a single environment.
          </Typography>

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

          <Typography component="p">
            According to TCC Africa, HospitiumRIS reflects the organization's broader commitment to strengthening
            Africa's research and knowledge infrastructure through open, interoperable, and institutionally driven
            digital solutions that improve the visibility, governance, and long-term preservation of research outputs.
          </Typography>

          <Typography component="p">
            By supporting research lifecycle management and strengthening institutional research ecosystems,
            HospitiumRIS aims to help healthcare institutions improve operational efficiency, enhance collaboration,
            strengthen research integrity, and ensure that valuable scientific and clinical knowledge remains
            discoverable, accessible, and reusable for future generations.
          </Typography>
        </Box>

        <Divider sx={{ mt: 5, mb: 4 }} />

        {/* Share */}
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
            Share this article
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {[
              {
                label: 'X / Twitter',
                icon: <TwitterIcon fontSize="small" />,
                href: `https://twitter.com/intent/tweet?url=${encodeURIComponent('https://hospitium.hospitiumris.org/news/tcc-africa-introduces-hospitiumris')}&text=${encodeURIComponent('TCC Africa Introduces HospitiumRIS to Strengthen Research Management and Knowledge Preservation in Healthcare Institutions')}`,
                external: true,
              },
              {
                label: 'LinkedIn',
                icon: <LinkedInIcon fontSize="small" />,
                href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://hospitium.hospitiumris.org/news/tcc-africa-introduces-hospitiumris')}`,
                external: true,
              },
              {
                label: 'Facebook',
                icon: <FacebookIcon fontSize="small" />,
                href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://hospitium.hospitiumris.org/news/tcc-africa-introduces-hospitiumris')}`,
                external: true,
              },
              {
                label: 'Email',
                icon: <EmailIcon fontSize="small" />,
                href: `mailto:?subject=${encodeURIComponent('TCC Africa Introduces HospitiumRIS')}&body=${encodeURIComponent('Read the full press release: https://hospitium.hospitiumris.org/news/tcc-africa-introduces-hospitiumris')}`,
                external: false,
              },
            ].map((item) => (
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

        {/* Contact block */}
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
            For More Information
          </Typography>

          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: theme.palette.text.primary,
              mb: 0.5,
            }}
          >
            Public Relations Team
          </Typography>

          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: theme.palette.text.primary,
              mb: 2,
            }}
          >
            Training Centre in Communication
          </Typography>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
            }}
          >
            <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }}>
              Faculty of Science Technology and Innovation
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }}>
              Gecaga Institute Bldg., University of Nairobi
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }}>
              Landline:{' '}
              <Link href="tel:+254208086820" underline="hover" sx={{ color: 'inherit' }}>
                +254 020 808 6820
              </Link>
              {' '}·{' '}
              <Link href="tel:+254202697401" underline="hover" sx={{ color: 'inherit' }}>
                +254 020 2697401
              </Link>
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }}>
              Email:{' '}
              <Link href="mailto:pr@tcc-africa.org" underline="hover" sx={{ color: theme.palette.primary.main }}>
                pr@tcc-africa.org
              </Link>
              {' '}·{' '}
              <Link href="mailto:info@hospitiumris.org" underline="hover" sx={{ color: theme.palette.primary.main }}>
                info@hospitiumris.org
              </Link>
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary }}>
              Website:{' '}
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
