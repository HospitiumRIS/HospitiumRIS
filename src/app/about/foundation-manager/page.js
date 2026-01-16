'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';

const FoundationManagerPage = () => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: '#8b6cbc',
          color: 'white',
          py: { xs: 6, md: 8 },
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
              mb: 3,
              textAlign: 'center',
              fontSize: { xs: '2rem', md: '2.75rem' },
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            Value Proposition for Fundraising/Foundation Managers
          </Typography>
          <Typography
            variant="h5"
            sx={{
              textAlign: 'center',
              maxWidth: '900px',
              mx: 'auto',
              opacity: 0.98,
              fontWeight: 400,
              lineHeight: 1.7,
              fontSize: { xs: '1.1rem', md: '1.25rem' },
            }}
          >
            HospitiumRIS is a digital research management platform that transforms hospitals into hubs of credible, measurable, and impactful research. It equips institutions with the tools to document, monitor, and report research excellence — empowering clinicians and administrators to improve care, demonstrate outcomes, and unlock further funding with confidence.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Core Features */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 4,
            color: theme.palette.text.primary,
            fontSize: { xs: '1.75rem', md: '2rem' },
          }}
        >
          Key Features for Foundation Managers
        </Typography>

        {/* Feature Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {/* Feature 1 */}
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 calc(50% - 16px)',
              minWidth: { xs: '100%', md: 'calc(50% - 16px)' },
              p: { xs: 3, md: 4 },
              borderLeft: '4px solid #8b6cbc',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.02)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>
              1. Enabling Evidence Driven Healthcare Innovation
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              HospitiumRIS provides hospitals with a fully integrated digital infrastructure to organize, track, and elevate research activity from ideation to publication. It captures key elements such as:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Researcher profiles and expertise',
                'Project planning and execution',
                'Outputs and publication impact',
                'Compliance documentation and governance',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
              Why funders should care:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              {[
                'Generates evidence that powers improved healthcare delivery and policy decisions',
                'Supports context specific solutions instead of imported models — especially critical in resource limited settings',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5, fontStyle: 'italic', color: theme.palette.text.secondary }}>
                  {item}
                </Typography>
              ))}
            </Box>
          </Paper>

          {/* Feature 2 */}
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 calc(50% - 16px)',
              minWidth: { xs: '100%', md: 'calc(50% - 16px)' },
              p: { xs: 3, md: 4 },
              borderLeft: '4px solid #8b6cbc',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.02)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>
              2. Strengthening Accountability & Transparency
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              HospitiumRIS offers built in compliance and governance tracking including ethics approvals, data protection controls, and audit trails. It ensures that research funded by public, philanthropic, or institutional grants is properly documented, tracked, and reported.
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
              Value for funders:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              {[
                'Enhanced return on investment visibility',
                'Clear metrics and compliance reporting for donors and stakeholders',
                'Open access support to make outputs widely accessible and impactful',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5, fontStyle: 'italic', color: theme.palette.text.secondary }}>
                  {item}
                </Typography>
              ))}
            </Box>
          </Paper>

          {/* Feature 3 */}
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 calc(50% - 16px)',
              minWidth: { xs: '100%', md: 'calc(50% - 16px)' },
              p: { xs: 3, md: 4 },
              borderLeft: '4px solid #8b6cbc',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.02)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>
              3. Driving Research Performance and Strategic Decision Making
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              With analytics, dashboards, and custom reporting tools, HospitiumRIS converts raw research data into actionable insights. Funders, hospital leadership, and research teams can monitor:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Performance metrics',
                'Trends over time',
                'Resource allocation efficiencies',
                'Project outcomes and impact indicators',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
              Why this matters to fundraisers:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              {[
                'Real time impact tracking strengthens donor confidence',
                'Data backed storytelling for fundraising campaigns and impact reports',
                'Demonstrates measurable progress and outcomes tied to investments',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5, fontStyle: 'italic', color: theme.palette.text.secondary }}>
                  {item}
                </Typography>
              ))}
            </Box>
          </Paper>

          {/* Feature 4 */}
          <Paper
            elevation={0}
            sx={{
              flex: '1 1 calc(50% - 16px)',
              minWidth: { xs: '100%', md: 'calc(50% - 16px)' },
              p: { xs: 3, md: 4 },
              borderLeft: '4px solid #8b6cbc',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.05)' : 'rgba(139, 108, 188, 0.02)',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#8b6cbc' }}>
              4. Catalyzing Collaboration & Institutional Growth
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              The platform fosters collaboration by connecting researchers, clinicians, administrators, and external partners. Features like team workspaces and shared communication tools break down silos and unlock multidisciplinary partnerships that unite hospitals, universities, NGOs, and funders.
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
              Fundraising advantage:
            </Typography>
            <Box component="ul" sx={{ pl: 3 }}>
              {[
                'Easier network building and coalition formation',
                'Unified platform to showcase multi partner impact',
                'Strengthens institutional research capacity — a key determinant in securing future grants',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5, fontStyle: 'italic', color: theme.palette.text.secondary }}>
                  {item}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Conclusion */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 6 },
            mt: 6,
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.1)' : 'rgba(139, 108, 188, 0.05)',
            borderRadius: 4,
            border: `2px solid`,
            borderColor: theme.palette.mode === 'dark' ? 'rgba(139, 108, 188, 0.3)' : 'rgba(139, 108, 188, 0.2)',
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 3,
              textAlign: 'center',
              color: '#8b6cbc',
              fontSize: { xs: '1.75rem', md: '2rem' },
            }}
          >
            Empowering Funders & Foundations
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.2rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            HospitiumRIS enables foundation managers to make informed funding decisions, track research impact in real-time, and demonstrate measurable outcomes to stakeholders. By providing transparent accountability and evidence-driven insights, the platform strengthens donor confidence and unlocks sustainable research funding for healthcare innovation.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default FoundationManagerPage;
