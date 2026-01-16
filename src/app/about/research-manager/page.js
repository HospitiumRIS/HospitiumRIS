'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';

const ResearchManagerPage = () => {
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
            Value Proposition for Hospital Administrators
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
            HospitiumRIS provides hospital leadership with a single, authoritative system to manage, govern, and strategically grow institutional research.
            It transforms research from a fragmented, high-risk activity into a well-governed, measurable, and value-generating institutional function.
          </Typography>
        </Container>
      </Box>

      {/* Value Proposition Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
      

        {/* Problem Statement */}
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
            What Problem It Solves for Hospital Administrators
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
            Hospital administrators are under pressure to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            {[
              'Demonstrate research compliance and accountability',
              'Improve institutional visibility and reputation',
              'Reduce administrative burden and operational inefficiencies',
              'Align research activity with hospital strategy, funding, and national priorities',
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
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.05rem', md: '1.125rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              fontWeight: 500,
            }}
          >
            HospitiumRIS directly addresses these challenges.
          </Typography>
        </Box>

        {/* Core Values */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 4,
            color: theme.palette.text.primary,
            fontSize: { xs: '1.75rem', md: '2rem' },
          }}
        >
          Core Value to Hospital Administration
        </Typography>

        {/* Value Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {/* Value 1 */}
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
              1. Centralised Institutional Oversight
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              HospitiumRIS provides a single source of truth for all hospital research activities:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Researchers and affiliations',
                'Research projects and funding',
                'Ethics approvals and governance documentation',
                'Publications, datasets, and outputs',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              This eliminates reliance on disconnected systems, spreadsheets, and manual reporting.
            </Typography>
          </Paper>

          {/* Value 2 */}
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
              2. Strengthened Governance, Risk, and Compliance
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              HospitiumRIS embeds research governance into daily operations by:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Tracking ethics approvals and compliance status',
                'Maintaining audit trails for research activity',
                'Supporting institutional and regulatory reporting requirements',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              Administrators gain clear visibility into compliance risks and institutional obligations.
            </Typography>
          </Paper>

          {/* Value 3 */}
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
              3. Operational Efficiency and Cost Reduction
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              By automating routine research administration tasks, HospitiumRIS:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Reduces duplication of data entry',
                'Streamlines reporting for management, funders, and regulators',
                'Minimises administrative workload across departments',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              This allows limited administrative capacity to be used more strategically.
            </Typography>
          </Paper>

          {/* Value 4 */}
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
              4. Strategic Decision-Making Through Real-Time Insights
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              HospitiumRIS delivers dashboards and analytics that enable administrators to:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Monitor research performance and productivity',
                'Identify active research areas and gaps',
                'Assess return on investment for research programmes',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              Leadership can make evidence-based decisions about funding, staffing, and partnerships.
            </Typography>
          </Paper>

          {/* Value 5 */}
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
              5. Institutional Visibility and Reputation Building
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              HospitiumRIS enhances the hospital&apos;s research profile by:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Aggregating and showcasing research outputs',
                'Supporting open access and discoverability',
                'Enabling accurate reporting to national and international stakeholders',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              This strengthens the hospital&apos;s positioning as a credible research and innovation institution.
            </Typography>
          </Paper>

          {/* Value 6 */}
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
              6. Future-Ready and Interoperable
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 2 }}>
              HospitiumRIS is designed to:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              {[
                'Integrate with identifiers, repositories, and research infrastructure',
                'Support open science and digital research management strategies',
                'Scale with institutional growth',
              ].map((item, index) => (
                <Typography component="li" key={index} sx={{ fontSize: '1.05rem', lineHeight: 1.8, mb: 0.5 }}>
                  {item}
                </Typography>
              ))}
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.8, fontStyle: 'italic', color: theme.palette.text.secondary }}>
              Ensuring long-term sustainability and alignment with global research standards.
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
            In Conclusion
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
            For hospital administrators, HospitiumRIS is not just a research system—it is a governance and management tool that:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            {[
              'Improves compliance and accountability',
              'Reduces administrative risk and inefficiency',
              'Provides leadership with actionable insights',
              'Strengthens institutional reputation and sustainability',
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
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1.1rem', md: '1.2rem' },
              lineHeight: 1.9,
              color: theme.palette.text.primary,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            HospitiumRIS enables hospitals to manage research as a strategic institutional asset, not an administrative burden.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResearchManagerPage;
