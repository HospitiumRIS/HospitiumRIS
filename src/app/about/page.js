'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
  Chip,
  Button,
  Divider,
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
  ArrowForward as ArrowForwardIcon,
  LocalHospital as HospitalIcon,
  School as SchoolIcon,
  Biotech as ClinicalIcon,
  AccountTree as EcosystemIcon,
} from '@mui/icons-material';

const PURPLE = '#8b6cbc';
const PURPLE_DARK = '#764ba2';
const PURPLE_LIGHT = 'rgba(139,108,188,0.1)';
const PURPLE_MEDIUM = 'rgba(139,108,188,0.18)';

const IconBox = ({ children, theme }) => (
  <Box
    sx={{
      width: 64,
      height: 64,
      borderRadius: '16px',
      backgroundColor: theme.palette.mode === 'dark' ? PURPLE_MEDIUM : PURPLE_LIGHT,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      mb: 2.5,
      flexShrink: 0,
      '& svg': { fontSize: 30, color: PURPLE },
    }}
  >
    {children}
  </Box>
);

const AboutPage = () => {
  const theme = useTheme();

  const benefits = [
    {
      icon: <HubIcon />,
      title: 'Streamlined Administration',
      description: 'Centralize research administration and ethics workflows — reducing manual processes and administrative burden.',
    },
    {
      icon: <VisibilityIcon />,
      title: 'Institutional Visibility',
      description: 'Showcase publications, datasets, and researcher profiles globally to strengthen your institution\'s academic reputation.',
    },
    {
      icon: <AnalyticsIcon />,
      title: 'Data-Driven Decisions',
      description: 'Leverage analytics dashboards for citation metrics, research trends, and departmental performance reporting.',
    },
    {
      icon: <HandshakeIcon />,
      title: 'Enhanced Collaboration',
      description: 'Connect researchers, funders, ethics committees, and regulatory bodies on a single secure platform.',
    },
    {
      icon: <GavelIcon />,
      title: 'Compliance & Governance',
      description: 'Built-in ethics tracking, audit trails, and compliance workflows for regulatory-ready research governance.',
    },
    {
      icon: <SecurityIcon />,
      title: 'Secure & Resilient',
      description: 'Enterprise-grade access controls, data protection workflows, and governance structures you can trust.',
    },
  ];

  const userRoles = [
    {
      title: 'Research Manager',
      icon: <TrendingUpIcon />,
      description: 'Oversee institutional research activities, manage workflows, and monitor research output with comprehensive analytics dashboards.',
      href: '/about/research-manager',
    },
    {
      title: 'Researchers',
      icon: <ScienceIcon />,
      description: 'Manage publications, track projects, conduct research, and ensure compliance & ethics approvals through an integrated researcher portal.',
      href: '/about/researchers',
    },
    {
      title: 'Foundation Manager',
      icon: <AccountBalanceIcon />,
      description: 'Coordinate grants, manage fundraising campaigns, track donors, and measure the impact of research investments.',
      href: '/about/foundation-manager',
    },
  ];

  const values = [
    { icon: <InnovationIcon />, title: 'Innovative', description: 'Leveraging cutting-edge technology and AI to transform hospital research management.' },
    { icon: <HubIcon />,        title: 'Centralized', description: 'One unified platform for the entire research lifecycle — from proposal to publication.' },
    { icon: <VerifiedIcon />,   title: 'Proactive',   description: 'Anticipating institutional needs and enabling data-driven research excellence.' },
  ];

  const institutions = [
    { icon: <HospitalIcon />,     label: 'University Teaching Hospitals' },
    { icon: <SchoolIcon />,       label: 'Medical Schools' },
    { icon: <ClinicalIcon />,     label: 'Clinical Trial Centres' },
    { icon: <GavelIcon />,        label: 'Ethics Review Boards' },
    { icon: <EcosystemIcon />,    label: 'Health Research Institutes' },
    { icon: <AccountBalanceIcon />, label: 'Health Ministries' },
    { icon: <HubIcon />,          label: 'Research Support Offices' },
    { icon: <HandshakeIcon />,    label: 'International Research Partners' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>

      {/* ── Hero ── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${PURPLE_DARK} 0%, ${PURPLE} 100%)`,
          color: 'white',
          py: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 18% 50%, rgba(255,255,255,0.12) 0%, transparent 55%)',
          },
          '&::after': {
            content: '""', position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 82% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Chip
            label="About HospitiumRIS"
            sx={{
              mb: 3,
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.8rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          />
          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2.4rem', md: '3.8rem' },
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              textShadow: '0 2px 12px rgba(0,0,0,0.12)',
            }}
          >
            Transforming Hospital<br />Research Management
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: '720px', mx: 'auto', mt: 3,
              opacity: 0.9, fontWeight: 300, lineHeight: 1.7,
              fontSize: { xs: '1rem', md: '1.2rem' },
            }}
          >
            HospitiumRIS is a healthcare-focused Research Information System designed to help hospitals,
            medical schools, and health research organisations manage the entire research lifecycle through
            a centralized digital infrastructure.
          </Typography>
          <Box sx={{ mt: 5, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              href="/register"
              endIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: 'white', color: PURPLE, fontWeight: 700,
                px: 4, py: 1.5, fontSize: '1rem', borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)', transform: 'translateY(-2px)' },
                transition: 'all 0.25s ease',
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/faq"
              sx={{
                borderColor: 'rgba(255,255,255,0.6)', color: 'white', fontWeight: 600,
                px: 4, py: 1.5, fontSize: '1rem', borderRadius: 2,
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                transition: 'all 0.25s ease',
              }}
            >
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── What is HospitiumRIS ── */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: 2, color: theme.palette.text.primary, fontSize: { xs: '1.9rem', md: '2.5rem' }, letterSpacing: '-0.02em' }}
          >
            What is HospitiumRIS?
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: theme.palette.text.secondary, maxWidth: '820px', mx: 'auto', lineHeight: 1.9, fontSize: { xs: '1rem', md: '1.1rem' } }}
          >
            HospitiumRIS (Research Information System) is an integrated digital infrastructure designed to
            manage, track, monitor, and showcase the entire research lifecycle in hospitals and health research
            institutions. It enables seamless coordination between clinicians, researchers, ethics committees,
            funders, and regulators through one centralized and secure platform.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {[
            {
              title: 'The Problem',
              points: [
                'Fragmented research data across departments',
                'Manual, error-prone reporting systems',
                'Poor research visibility and discoverability',
                'Compliance and ethics management challenges',
                'No centralized researcher profiles',
              ],
              accent: theme.palette.mode === 'dark' ? 'rgba(239,83,80,0.15)' : 'rgba(239,83,80,0.06)',
              border: 'rgba(239,83,80,0.25)',
            },
            {
              title: 'Our Solution',
              points: [
                'Unified research administration platform',
                'Real-time analytics and institutional dashboards',
                'Global visibility via ORCID, Crossref & DataCite',
                'Built-in ethics, compliance & audit workflows',
                'AI-powered publication summaries & insights',
              ],
              accent: theme.palette.mode === 'dark' ? PURPLE_MEDIUM : PURPLE_LIGHT,
              border: 'rgba(139,108,188,0.3)',
            },
          ].map((col, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                flex: '1 1 0',
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                backgroundColor: col.accent,
                border: `1px solid ${col.border}`,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: i === 1 ? PURPLE : theme.palette.text.primary }}>
                {col.title}
              </Typography>
              {col.points.map((p, pi) => (
                <Box key={pi} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 7, height: 7, borderRadius: '50%', mt: 0.85, flexShrink: 0,
                      backgroundColor: i === 1 ? PURPLE : theme.palette.error.main,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                    {p}
                  </Typography>
                </Box>
              ))}
            </Paper>
          ))}
        </Box>
      </Container>

      {/* ── Our Values ── */}
      <Box
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.3) 100%)'
            : 'linear-gradient(180deg, #f8f9fc 0%, #f1f3f9 100%)',
          py: { xs: 7, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: 1.5, textAlign: 'center', color: theme.palette.text.primary, fontSize: { xs: '1.9rem', md: '2.5rem' }, letterSpacing: '-0.02em' }}
          >
            Our Values
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 6, fontSize: { xs: '1rem', md: '1.1rem' } }}>
            Innovative. Centralized. Proactive.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
            {values.map((v, i) => (
              <Paper
                key={i}
                elevation={0}
                sx={{
                  flex: '1 1 0',
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  textAlign: 'center',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 32px rgba(139,108,188,0.15)',
                    borderColor: 'rgba(139,108,188,0.35)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
                  <IconBox theme={theme}>{v.icon}</IconBox>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: PURPLE }}>
                  {v.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                  {v.description}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Benefits ── */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, mb: 1.5, textAlign: 'center', color: theme.palette.text.primary, fontSize: { xs: '1.9rem', md: '2.5rem' }, letterSpacing: '-0.02em' }}
        >
          Strategic Benefits
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 6, fontSize: { xs: '1rem', md: '1.1rem' } }}>
          What HospitiumRIS delivers for your institution
        </Typography>
        <Box
          sx={{
            display: 'flex', flexWrap: 'wrap', gap: 3,
            '& > *': { flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(33.33% - 16px)' }, minWidth: 0 },
          }}
        >
          {benefits.map((b, i) => (
            <Paper
              key={i}
              elevation={0}
              sx={{
                p: { xs: 3, md: 3.5 },
                borderRadius: 3,
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: '0 16px 40px rgba(139,108,188,0.14)',
                  borderColor: 'rgba(139,108,188,0.35)',
                },
              }}
            >
              <IconBox theme={theme}>{b.icon}</IconBox>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: theme.palette.text.primary, fontSize: '1rem' }}>
                {b.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                {b.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      {/* ── Who We Serve ── */}
      <Box
        sx={{
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.3) 100%)'
            : 'linear-gradient(180deg, #f8f9fc 0%, #f1f3f9 100%)',
          py: { xs: 7, md: 10 },
        }}
      >
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            sx={{ fontWeight: 700, mb: 1.5, textAlign: 'center', color: theme.palette.text.primary, fontSize: { xs: '1.9rem', md: '2.5rem' }, letterSpacing: '-0.02em' }}
          >
            Who Uses HospitiumRIS?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 6, maxWidth: 640, mx: 'auto', fontSize: { xs: '1rem', md: '1.1rem' } }}>
            Built for the full spectrum of health research institutions — from small research units to national referral hospitals.
          </Typography>

          {/* Institutions grid */}
          <Box
            sx={{
              display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mb: 8,
            }}
          >
            {institutions.map((inst, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.2,
                  px: 2.5, py: 1.5,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  '& svg': { fontSize: 20, color: PURPLE },
                }}
              >
                {React.cloneElement(inst.icon, { sx: { fontSize: 20, color: PURPLE } })}
                <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary, whiteSpace: 'nowrap' }}>
                  {inst.label}
                </Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ mb: 8 }} />

          {/* User Role Cards */}
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, mb: 4, textAlign: 'center', color: theme.palette.text.primary, letterSpacing: '-0.01em' }}
          >
            Platform User Roles
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
            {userRoles.map((role, i) => (
              <Link
                key={i}
                href={role.href}
                style={{ textDecoration: 'none', flex: '1 1 0', minWidth: 0 }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    height: '100%',
                    p: { xs: 3, md: 4 },
                    textAlign: 'center',
                    border: `2px solid ${theme.palette.divider}`,
                    borderRadius: 3,
                    backgroundColor: theme.palette.background.paper,
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      borderColor: PURPLE,
                      transform: 'translateY(-6px)',
                      boxShadow: '0 16px 40px rgba(139,108,188,0.15)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        width: 72, height: 72, borderRadius: '50%',
                        backgroundColor: PURPLE_LIGHT,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mb: 2.5,
                        '& svg': { fontSize: 36, color: PURPLE },
                      }}
                    >
                      {React.cloneElement(role.icon, { sx: { fontSize: 36, color: PURPLE } })}
                    </Box>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: theme.palette.text.primary }}>
                    {role.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2.5 }}>
                    {role.description}
                  </Typography>
                  <Typography variant="body2" sx={{ color: PURPLE, fontWeight: 600, fontSize: '0.88rem' }}>
                    Learn more →
                  </Typography>
                </Paper>
              </Link>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ── Developed By ── */}
      <Container maxWidth="lg" sx={{ py: { xs: 7, md: 10 } }}>
        <Typography
          variant="h3"
          sx={{ fontWeight: 700, mb: 1.5, textAlign: 'center', color: theme.palette.text.primary, fontSize: { xs: '1.9rem', md: '2.5rem' }, letterSpacing: '-0.02em' }}
        >
          Developed By
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 6, fontSize: { xs: '1rem', md: '1.1rem' } }}>
          A product of open infrastructure and research visibility expertise
        </Typography>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 4,
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Box sx={{ display: 'flex', gap: 4, flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'flex-start' }}>
            {/* About TCC */}
            <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: PURPLE }}>
                Training Centre in Communication Africa
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.9, mb: 2 }}>
                TCC Africa is a leading African research communication and capacity-building organisation
                based at the University of Nairobi. It supports African and Global South researchers,
                institutions, and publishers to improve research quality, visibility, and impact through
                training, tools, and open infrastructure.
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.9 }}>
                HospitiumRIS was developed as part of TCC Africa&apos;s broader mission to advance Open
                Infrastructure and research visibility for health institutions across Africa and the Global South.
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />

            {/* Contact Info */}
            <Box sx={{ flex: '0 1 280px', minWidth: { xs: '100%', md: 250 } }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5, color: theme.palette.text.primary }}>
                Get in Touch
              </Typography>
              {[
                { icon: <LocationIcon sx={{ fontSize: 18, color: PURPLE, mt: 0.3, flexShrink: 0 }} />, content: 'Chiromo Campus, University of Nairobi\nGecaga Institute Bldg.\nP.O Box 21553-00100, Nairobi, Kenya' },
                { icon: <PhoneIcon sx={{ fontSize: 18, color: PURPLE, flexShrink: 0 }} />, content: '+254 (0)20 8086820\n+254 (0)20 2697401' },
                { icon: <EmailIcon sx={{ fontSize: 18, color: PURPLE, flexShrink: 0 }} />, content: 'info@tcc-africa.org', href: 'mailto:info@tcc-africa.org' },
                { icon: <WebIcon sx={{ fontSize: 18, color: PURPLE, flexShrink: 0 }} />, content: 'www.tcc-africa.org', href: 'https://www.tcc-africa.org' },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                  {item.icon}
                  {item.href ? (
                    <Link href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                      style={{ color: PURPLE, fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none' }}>
                      {item.content}
                    </Link>
                  ) : (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {item.content}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* ── CTA ── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${PURPLE_DARK} 0%, ${PURPLE} 100%)`,
          py: { xs: 8, md: 10 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""', position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 15% 50%, rgba(255,255,255,0.1) 0%, transparent 55%)',
          },
          '&::after': {
            content: '""', position: 'absolute',
            top: -40, right: -40, width: 200, height: 200,
            borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)',
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 800, mb: 2, color: 'white', fontSize: { xs: '2rem', md: '2.8rem' }, letterSpacing: '-0.02em' }}
          >
            Ready to Transform Your Institution?
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: 'rgba(255,255,255,0.88)', mb: 5, fontWeight: 300, lineHeight: 1.7, fontSize: { xs: '1rem', md: '1.15rem' } }}
          >
            Join hospitals, universities, and research institutes building data-driven research ecosystems with HospitiumRIS.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2.5, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              href="/register"
              endIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: 'white', color: PURPLE, fontWeight: 700,
                px: 5, py: 1.6, fontSize: '1rem', borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)', transform: 'translateY(-2px)' },
                transition: 'all 0.25s ease',
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              href="/contact"
              sx={{
                borderColor: 'rgba(255,255,255,0.6)', color: 'white', fontWeight: 600,
                px: 5, py: 1.6, fontSize: '1rem', borderRadius: 2,
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' },
                transition: 'all 0.25s ease',
              }}
            >
              Request a Demo
            </Button>
          </Box>
        </Container>
      </Box>

    </Box>
  );
};

export default AboutPage;

