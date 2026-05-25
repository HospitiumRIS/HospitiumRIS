'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  Chip,
  List,
  ListItem,
  Link,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpIcon,
  FiberManualRecord as BulletIcon,
} from '@mui/icons-material';

const faqData = [
  {
    category: 'Overview',
    questions: [
      {
        question: 'What is HospitiumRIS?',
        answer: 'HospitiumRIS is a healthcare-focused Research Information System (RIS) designed to help hospitals, university teaching hospitals, medical research institutes, and health research organizations manage, track, monitor, and showcase the entire research lifecycle through a centralized digital infrastructure.',
      },
      {
        question: 'What problem does HospitiumRIS solve?',
        answer: 'Many hospitals and research institutions struggle with:',
        bullets: [
          'Fragmented research data',
          'Manual reporting systems',
          'Poor research visibility',
          'Difficulty tracking publications and grants',
          'Compliance and ethics management challenges',
          'Lack of centralized researcher profiles',
          'Weak institutional research analytics',
        ],
        footer: 'HospitiumRIS addresses these challenges by integrating research administration, compliance, publishing, analytics, and researcher profiling into one unified system.',
      },
    ],
  },
  {
    category: 'Who Can Use HospitiumRIS?',
    questions: [
      {
        question: 'Who can use HospitiumRIS?',
        answer: 'HospitiumRIS is designed for:',
        bullets: [
          'University teaching hospitals',
          'Referral hospitals',
          'Medical schools',
          'Clinical trial centers',
          'Public health institutions',
          'Research institutes',
          'Ethics review boards',
          'Health ministries',
          'Research support offices',
          'Academic researchers and clinicians',
        ],
      },
      {
        question: 'Is HospitiumRIS only for large hospitals?',
        answer: 'No. HospitiumRIS can support:',
        bullets: [
          'Small research units',
          'Medium-sized hospitals',
          'National referral hospitals',
          'Regional research institutes',
          'Multi-campus university systems',
          'University teaching hospitals',
        ],
      },
    ],
  },
  {
    category: 'Features & Capabilities',
    questions: [
      {
        question: 'What are the main features of HospitiumRIS?',
        answer: 'Key features include:',
        bullets: [
          'Researcher Profiles',
          'Research Project Management',
          'Publication, Publishing lifecycle & Outputs Management',
          'Clinical Research Tracking',
          'Grant and Funding Monitoring',
          'Ethics & Compliance Management',
          'AI-powered publication summaries',
          'Citation and impact analytics',
          'Institutional dashboards',
          'Open Access support',
          'PID integrations (ORCID, Crossref, DataCite)',
          'Audit trails and governance tools',
        ],
      },
      {
        question: 'How does HospitiumRIS support researcher profiles?',
        answer: 'HospitiumRIS allows researchers to:',
        bullets: [
          'Build comprehensive academic profiles',
          'Track publications and citations',
          'Collaboratively write scientific papers, project and grant proposals',
          'Showcase grants and collaborations',
          'Generate CVs automatically',
          'Link institutional affiliations',
          'Integrate ORCID identifiers',
        ],
        footer: 'This improves institutional and individual research visibility globally.',
      },
      {
        question: 'Does HospitiumRIS support ORCID integration?',
        answer: 'Yes. HospitiumRIS integrates with:',
        bullets: [
          'ORCID for researcher identities',
          'Crossref for publications',
          'DataCite for datasets and research objects',
        ],
        footer: 'This allows seamless interoperability with global scholarly infrastructure.',
      },
      {
        question: 'Can HospitiumRIS manage research projects?',
        answer: 'Yes. The platform supports:',
        bullets: [
          'Proposal tracking',
          'Timeline management',
          'Milestone monitoring',
          'Team coordination',
          'Resource allocation',
          'Research workflow tracking',
          'Progress reporting',
        ],
      },
      {
        question: 'Does HospitiumRIS support ethics and compliance management?',
        answer: 'Yes. HospitiumRIS includes governance and compliance tools for:',
        bullets: [
          'Ethics approvals',
          'Institutional review workflows',
          'Data protection compliance',
          'Audit trails',
          'Research governance tracking',
          'Regulatory reporting',
        ],
      },
      {
        question: 'Can HospitiumRIS support clinical trials management?',
        answer: 'Yes. HospitiumRIS is suitable for:',
        bullets: [
          'Clinical trial administration',
          'Participant tracking',
          'Protocol management',
          'Compliance documentation',
          'Trial reporting',
          'Collaborative clinical research oversight',
        ],
        footer: 'It is especially useful for university teaching hospitals and health research institutions conducting translational and clinical research.',
      },
      {
        question: 'Does HospitiumRIS support Artificial Intelligence (AI)?',
        answer: 'Yes. HospitiumRIS incorporates AI-powered capabilities such as:',
        bullets: [
          'Automated publication summaries',
          'Keyword extraction',
          'Research trend identification',
          'Intelligent metadata support',
        ],
      },
      {
        question: 'Can HospitiumRIS manage publications and institutional repositories?',
        answer: 'Yes. HospitiumRIS supports:',
        bullets: [
          'Publication management',
          'Institutional research output tracking',
          'Citation management',
          'Open Access support',
          'Metadata organization',
          'Research dissemination workflows',
        ],
      },
    ],
  },
  {
    category: 'Analytics & Institutional Impact',
    questions: [
      {
        question: 'How does HospitiumRIS improve institutional visibility?',
        answer: 'HospitiumRIS improves visibility by:',
        bullets: [
          'Centralizing institutional research outputs',
          'Showcasing publications and datasets',
          'Tracking citation metrics',
          'Supporting Open Access dissemination',
          'Enhancing discoverability of institutional expertise',
          'Providing analytics dashboards for strategic reporting',
        ],
      },
      {
        question: 'What analytics capabilities does HospitiumRIS provide?',
        answer: 'HospitiumRIS offers:',
        bullets: [
          'Citation analytics',
          'Publication tracking',
          'Departmental performance dashboards',
          'Research impact monitoring',
          'Custom institutional reports',
          'Research trend analysis',
          'Collaboration analytics',
        ],
      },
      {
        question: 'Can HospitiumRIS help hospitals improve rankings and visibility?',
        answer: 'Yes. By centralizing and showcasing research outputs, citation metrics, collaborations, and institutional expertise, HospitiumRIS strengthens:',
        bullets: [
          'Institutional reputation',
          'Research visibility',
          'Funding competitiveness',
          'International collaboration readiness',
          'Benchmarking and ranking performance',
        ],
      },
    ],
  },
  {
    category: 'Context & Integration',
    questions: [
      {
        question: 'Is HospitiumRIS suitable for African and Global South institutions?',
        answer: 'Yes. HospitiumRIS was developed with a strong understanding of:',
        bullets: [
          'African and Global South research ecosystems',
          'Institutional capacity challenges',
          'Research visibility gaps',
          'Open Science priorities',
          'Data sovereignty considerations',
          'Limited interoperability environments',
        ],
        footer: 'It is designed to support both local institutional needs and global scholarly interoperability.',
      },
      {
        question: 'How does HospitiumRIS support Open Science?',
        answer: 'HospitiumRIS supports Open Science by:',
        bullets: [
          'Improving access to institutional research outputs',
          'Supporting Open Access publishing',
          'Enhancing metadata interoperability',
          'Integrating persistent identifiers',
          'Strengthening discoverability and reuse of research outputs',
        ],
      },
      {
        question: 'Can HospitiumRIS integrate with existing institutional systems?',
        answer: 'Yes. HospitiumRIS is designed to integrate with:',
        bullets: [
          'Institutional repositories and databases',
          'Publication databases',
          'Research management systems',
          'ORCID',
          'Crossref',
          'DataCite',
          'Institutional authentication systems',
        ],
      },
      {
        question: 'Is HospitiumRIS cloud-based?',
        answer: 'HospitiumRIS supports centralized digital infrastructure deployment and can be configured depending on institutional requirements, including cloud-hosted or institutionally managed environments.',
      },
      {
        question: 'Does HospitiumRIS support multi-institutional collaboration?',
        answer: 'Yes. The system supports collaboration among:',
        bullets: [
          'Hospitals',
          'Universities',
          'Funders',
          'Regulators',
          'Ethics committees',
          'International research partners',
        ],
      },
    ],
  },
  {
    category: 'Governance, Security & Integrity',
    questions: [
      {
        question: 'What makes HospitiumRIS different from general hospital management systems?',
        answer: 'Unlike general hospital systems focused on patient administration and clinical operations, HospitiumRIS specifically focuses on:',
        bullets: [
          'Research lifecycle management',
          'Scholarly outputs',
          'Clinical research governance',
          'Institutional research intelligence',
          'Research visibility and analytics',
          'Academic collaboration infrastructure',
        ],
      },
      {
        question: 'Does HospitiumRIS support reporting for funders and regulators?',
        answer: 'Yes. HospitiumRIS can generate:',
        bullets: [
          'Institutional reports',
          'Research performance summaries',
          'Compliance documentation',
          'Grant progress reports',
          'Publication outputs',
          'Research analytics dashboards',
        ],
        footer: 'This supports accountability and evidence-based decision-making.',
      },
      {
        question: 'How secure is HospitiumRIS?',
        answer: 'HospitiumRIS incorporates:',
        bullets: [
          'Centralized governance structures',
          'Secure access controls',
          'Audit trails',
          'Compliance monitoring',
          'Data protection workflows',
        ],
      },
      {
        question: 'How does HospitiumRIS support research integrity?',
        answer: 'The platform supports research integrity through:',
        bullets: [
          'Audit trails',
          'Compliance workflows',
          'Ethics tracking',
          'Transparent reporting',
          'Research governance monitoring',
          'Documentation management',
        ],
      },
    ],
  },
  {
    category: 'About HospitiumRIS',
    questions: [
      {
        question: 'What is the long-term vision of HospitiumRIS?',
        answer: 'The long-term vision is to transform hospitals and health institutions into:',
        bullets: [
          'Data-driven research ecosystems',
          'Globally visible research hubs',
          'Collaborative innovation environments',
          'Open Science-enabled institutions',
          'Digitally connected health research infrastructures',
        ],
      },
      {
        question: 'Who developed HospitiumRIS?',
        answer: 'HospitiumRIS was developed by Training Centre in Communication (TCC Africa) as part of its broader Open Infrastructure and research visibility initiatives supporting African and Global South research ecosystems.',
      },
      {
        question: 'Where can institutions learn more or request a demonstration?',
        answer: 'Institutions can learn more and request a demonstration through the official HospitiumRIS platform or by contacting TCC Africa directly:',
        bullets: [
          'Website: www.tcc-africa.org',
          'Email: info@tcc-africa.org',
          'Phone: +254 (0)20 8086820 / +254 (0)20 2697401',
          'Address: Chiromo Campus, University of Nairobi, Gecaga Institute Bldg., P.O Box 21553-00100, Nairobi, Kenya',
        ],
      },
    ],
  },
];

const FAQPage = () => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const renderAnswer = (faq) => (
    <>
      {faq.answer && (
        <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.8, mb: faq.bullets ? 1 : 0 }}>
          {faq.answer}
        </Typography>
      )}
      {faq.bullets && (
        <List dense disablePadding sx={{ mb: faq.footer ? 1 : 0 }}>
          {faq.bullets.map((bullet, i) => (
            <ListItem key={i} disablePadding sx={{ py: 0.3, alignItems: 'flex-start' }}>
              <BulletIcon sx={{ fontSize: 8, color: theme.palette.primary.main, mr: 1.5, mt: 0.9, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, lineHeight: 1.7 }}>
                {bullet}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
      {faq.footer && (
        <Typography sx={{ color: theme.palette.text.secondary, lineHeight: 1.8, mt: 1 }}>
          {faq.footer}
        </Typography>
      )}
    </>
  );

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: theme.palette.background.default }}>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #764ba2 0%, #8b6cbc 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%)',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.15)',
              mb: 3,
            }}
          >
            <HelpIcon sx={{ fontSize: 38, color: 'white' }} />
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2.2rem', md: '3.5rem' },
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          >
            Frequently Asked Questions
          </Typography>
          <Typography
            variant="h6"
            sx={{
              maxWidth: '700px',
              mx: 'auto',
              opacity: 0.92,
              fontWeight: 300,
              lineHeight: 1.7,
              fontSize: { xs: '1rem', md: '1.2rem' },
            }}
          >
            Everything you need to know about HospitiumRIS — the healthcare-focused Research Information System.
          </Typography>
        </Container>
      </Box>

      {/* FAQ Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>

        {faqData.map((category, categoryIndex) => (
          <Box key={categoryIndex} sx={{ mb: 6 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={category.category}
                sx={{
                  backgroundColor: '#8b6cbc',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  px: 1,
                  letterSpacing: '0.02em',
                }}
              />
              <Box sx={{ flexGrow: 1, height: '2px', backgroundColor: theme.palette.divider }} />
            </Box>

            {category.questions.map((faq, faqIndex) => {
              const panelId = `panel-${categoryIndex}-${faqIndex}`;
              return (
                <Accordion
                  key={faqIndex}
                  expanded={expanded === panelId}
                  onChange={handleChange(panelId)}
                  elevation={0}
                  sx={{
                    mb: 1.5,
                    border: `1px solid`,
                    borderColor: expanded === panelId ? '#8b6cbc40' : theme.palette.divider,
                    borderRadius: '8px !important',
                    '&:before': { display: 'none' },
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: expanded === panelId
                      ? '0 4px 20px rgba(139,108,188,0.12)'
                      : '0 1px 4px rgba(0,0,0,0.06)',
                    '&.Mui-expanded': { mt: 0, mb: 1.5 },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: expanded === panelId ? '#8b6cbc' : theme.palette.text.secondary }} />
                    }
                    sx={{
                      borderRadius: '8px',
                      backgroundColor: expanded === panelId
                        ? 'rgba(139,108,188,0.06)'
                        : theme.palette.background.paper,
                      '&:hover': { backgroundColor: 'rgba(139,108,188,0.04)' },
                      transition: 'background-color 0.2s ease',
                      minHeight: 56,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: expanded === panelId ? '#8b6cbc' : theme.palette.text.primary,
                        fontSize: { xs: '0.95rem', md: '1.05rem' },
                        transition: 'color 0.2s ease',
                        pr: 1,
                      }}
                    >
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      px: 3,
                      pb: 3,
                      pt: 0,
                      borderTop: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Box sx={{ pt: 2 }}>
                      {renderAnswer(faq)}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        ))}

        {/* CTA Section */}
        <Box
          sx={{
            mt: 4,
            p: { xs: 4, md: 6 },
            background: 'linear-gradient(135deg, #764ba2 0%, #8b6cbc 100%)',
            borderRadius: 4,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -20, right: -20,
              width: 120, height: 120,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.08)',
            },
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5, color: 'white', position: 'relative', zIndex: 1 }}>
            Still have questions?
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, position: 'relative', zIndex: 1 }}>
            Can&apos;t find the answer you&apos;re looking for? Reach out to our support team.
          </Typography>
          <Link
            href="mailto:info@tcc-africa.org"
            sx={{
              display: 'inline-block',
              color: 'white',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
              border: '2px solid rgba(255,255,255,0.7)',
              borderRadius: '8px',
              px: 3,
              py: 1.2,
              position: 'relative',
              zIndex: 1,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderColor: 'white',
              },
            }}
          >
            info@tcc-africa.org
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default FAQPage;
