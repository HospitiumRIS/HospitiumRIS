'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';

const ResearchersPage = () => {
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
            Value Proposition for Researchers
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
            HospitiumRIS is a specialized Current Research Information System (CRIS) designed to empower researchers—especially within hospital settings—by streamlining how research activities are managed, shared, governed, and evaluated. It combines digital infrastructure with research workflows so researchers can focus on generating high impact, visible, and compliant outputs.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Why it matters */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: theme.palette.text.primary,
              fontSize: { xs: '1.75rem', md: '2rem' },
            }}
          >
            Why it matters
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.05rem', md: '1.125rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              fontWeight: 500,
            }}
          >
            Researchers in hospitals often lack integrated tools for managing research activities, which limits productivity and visibility. HospitiumRIS directly addresses this gap by providing a research centric digital backbone that turns isolated projects into structured, visible, and impactful scholarly contributions.
          </Typography>
        </Box>

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
          Core Features for Researchers
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
              1. Centralized Research Management Hub
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              HospitiumRIS provides a unified platform where you can:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Create and maintain a detailed researcher profile with expertise, CV, publications, and impact metrics.',
                'Track all research projects, timelines, resources, and outputs in one place.',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              This centralization eliminates scattered systems and reduces administrative burden, enabling more time for actual research.
            </Typography>
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
              2. Enhanced Research Visibility & Collaboration
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Share your profiles, publications, and outputs with peers and stakeholders across hospitals and institutions.',
                'Use built in collaboration tools such as team workspaces and document sharing to facilitate real time interactions.',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              This increases your network and opens doors for multidisciplinary partnerships.
            </Typography>
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
              3. Streamlined Project and Workflow Management
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              Researchers get tools tailored to academic needs:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Timeline planning, resource allocation, and progress tracking support every project phase.',
                'Structured templates and dashboards help monitor milestones and risks.',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              These features help you meet deadlines and stay aligned with project goals.
            </Typography>
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
              4. Compliance, Governance & Ethics Built In
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              HospitiumRIS incorporates important governance features that protect research integrity and fulfill institutional requirements:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Ethics approvals and regulatory compliance checks',
                'Data protection and robust audit trails',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              These reduce administrative friction and help you satisfy both internal and external oversight expectations.
            </Typography>
          </Paper>

          {/* Feature 5 */}
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
              5. Analytics & Impact Insights
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Comprehensive analytics dashboards show performance metrics, trends, and impact indicators for your research.',
                'Custom reports help you articulate research contributions to funders, administrators, and collaborators.',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              Insightful analytics enable data driven decisions and strengthen future proposals.
            </Typography>
          </Paper>

          {/* Feature 6 */}
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
              6. Publishing & Output Management
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              HospitiumRIS supports your research dissemination strategy:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Manage citations and publication records',
                'Facilitate open access outputs',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              This boosts discoverability and influence within your field.
            </Typography>
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
            In Conclusion — What You Gain as a Researcher
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.05rem', md: '1.125rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              mb: 2,
            }}
          >
            HospitiumRIS helps you:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            {[
              'Consolidate your research profile and outputs in a single, searchable system',
              'Improve project organization and collaboration',
              'Stay compliant with ethics and governance standards',
              'Monitor research performance with meaningful data',
              'Increase the visibility and impact of your work — both locally and globally',
              'Present stronger proposals and reports to stakeholders and funders',
            ].map((item, index) => (
              <Typography
                component="li"
                key={index}
                sx={{
                  fontSize: { xs: '1.05rem', md: '1.125rem' },
                  lineHeight: 1.9,
                  color: theme.palette.text.primary,
                  mb: 1,
                }}
              >
                {item}
              </Typography>
            ))}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResearchersPage;
