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
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpIcon,
} from '@mui/icons-material';

const faqData = [
  {
    category: 'General',
    questions: [
      {
        question: 'What is HospitiumRIS?',
        answer: 'HospitiumRIS is a comprehensive Research Information System designed to empower research excellence through integrated digital infrastructure. It provides tools for managing publications, projects, clinical trials, ethics applications, and more.',
      },
      {
        question: 'Who can use HospitiumRIS?',
        answer: 'HospitiumRIS is designed for researchers, research institutions, and foundations. Each user type has access to specific features tailored to their needs.',
      },
      {
        question: 'How do I get started?',
        answer: 'To get started, register for an account by clicking the "Register" button in the navigation bar. Once registered, you will receive an activation email to verify your account.',
      },
    ],
  },
  {
    category: 'Account & Access',
    questions: [
      {
        question: 'How do I reset my password?',
        answer: 'Click on the "Forgot Password" link on the login page. Enter your email address, and you will receive instructions to reset your password.',
      },
      {
        question: 'Can I link my ORCID account?',
        answer: 'Yes! HospitiumRIS supports ORCID integration. You can link your ORCID account in your profile settings to automatically import your publications and maintain synchronization.',
      },
      {
        question: 'What user roles are available?',
        answer: 'HospitiumRIS supports multiple user roles including Researchers, Institution Administrators, Foundation Managers, and Global Administrators. Each role has specific permissions and access to different features.',
      },
    ],
  },
  {
    category: 'Publications',
    questions: [
      {
        question: 'How do I add publications to my profile?',
        answer: 'You can add publications manually or import them from external sources like ORCID, PubMed, or Crossref. Navigate to the Publications section in your researcher portal to get started.',
      },
      {
        question: 'Can I collaborate on manuscripts?',
        answer: 'Yes! HospitiumRIS includes collaborative writing tools that allow you to work with other researchers on manuscripts in real-time.',
      },
      {
        question: 'How do I submit to preprint servers?',
        answer: 'Use the "Submit to Preprint" feature in the Publications menu to submit your work to bioRxiv, medRxiv, or AfricArXiv directly from the platform.',
      },
    ],
  },
  {
    category: 'Projects & Grants',
    questions: [
      {
        question: 'How do I create a project proposal?',
        answer: 'Navigate to the Projects section in your researcher portal and select "Project Proposals". Click "Create New Proposal" to start drafting your research proposal.',
      },
      {
        question: 'Can I track grant applications?',
        answer: 'Yes! The Grant Lifecycle feature allows you to track your grant applications from submission through to award and reporting.',
      },
      {
        question: 'How does budget management work?',
        answer: 'The Budget Management module allows you to create budgets, track expenses, and monitor spending against your project allocations.',
      },
    ],
  },
  {
    category: 'Clinical Trials',
    questions: [
      {
        question: 'What clinical trial features are available?',
        answer: 'HospitiumRIS provides comprehensive clinical trial management including trial registration, ethics approvals, team management, recruitment tracking, safety monitoring, and regulatory reporting.',
      },
      {
        question: 'How do I register a clinical trial?',
        answer: 'Use the "Trial Intake & Registration" feature to register your study concept and initiate trial setup. The system will guide you through the necessary steps.',
      },
      {
        question: 'Can I track GCP certifications?',
        answer: 'Yes! The platform includes team and GCP certification tracking to ensure compliance with Good Clinical Practice requirements.',
      },
    ],
  },
  {
    category: 'Technical Support',
    questions: [
      {
        question: 'What browsers are supported?',
        answer: 'HospitiumRIS works best with modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated to the latest version.',
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes! We implement industry-standard security measures including encryption, secure authentication, and regular backups to protect your data.',
      },
      {
        question: 'How do I report a bug or request a feature?',
        answer: 'You can report bugs or request features by contacting our support team at info@tcc-africa.org or through the GitHub repository.',
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        pt: 12,
        pb: 8,
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.light,
              mb: 3,
            }}
          >
            <HelpIcon sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: theme.palette.text.primary,
              fontSize: { xs: '2rem', md: '3rem' },
            }}
          >
            Frequently Asked Questions
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.secondary,
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            Find answers to common questions about HospitiumRIS
          </Typography>
        </Box>

        {faqData.map((category, categoryIndex) => (
          <Box key={categoryIndex} sx={{ mb: 6 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={category.category}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  px: 1,
                }}
              />
              <Box
                sx={{
                  flexGrow: 1,
                  height: '2px',
                  backgroundColor: theme.palette.divider,
                }}
              />
            </Box>

            {category.questions.map((faq, faqIndex) => {
              const panelId = `panel-${categoryIndex}-${faqIndex}`;
              return (
                <Accordion
                  key={faqIndex}
                  expanded={expanded === panelId}
                  onChange={handleChange(panelId)}
                  sx={{
                    mb: 2,
                    '&:before': {
                      display: 'none',
                    },
                    boxShadow: theme.shadows[2],
                    '&.Mui-expanded': {
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor:
                        expanded === panelId
                          ? theme.palette.primary.light + '10'
                          : theme.palette.background.paper,
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light + '08',
                      },
                      transition: 'background-color 0.3s ease',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        fontSize: '1.1rem',
                      }}
                    >
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      pt: 3,
                      pb: 3,
                    }}
                  >
                    <Typography
                      sx={{
                        color: theme.palette.text.secondary,
                        lineHeight: 1.8,
                      }}
                    >
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        ))}

        <Box
          sx={{
            mt: 8,
            p: 4,
            backgroundColor: theme.palette.primary.light + '10',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            Still have questions?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              mb: 2,
            }}
          >
            Can't find the answer you're looking for? Please contact our support team.
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.primary.main,
              fontWeight: 600,
            }}
          >
            Email: info@tcc-africa.org
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default FAQPage;
