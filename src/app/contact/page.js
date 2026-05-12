'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const DEMO_AREAS = [
  'Research Project Management',
  'Publications & Output Management',
  'Clinical Trials Management',
  'Ethics & Compliance Management',
  'Grants & Funding Management',
  'Research Analytics & Reporting',
  'Institutional Governance & Oversight',
  'Knowledge Preservation & Repositories',
];

const SUPPORT_AREAS = [
  'Account & Access Management',
  'Research Project Setup',
  'Publications & Output Tracking',
  'Clinical Trials Module',
  'Ethics & Compliance Workflows',
  'Grants & Funding Module',
  'Analytics & Reporting Dashboards',
  'Metadata & Repository Management',
  'System Integration & Interoperability',
  'Other / General Enquiry',
];

const ContactModal = ({ open, onClose, mode }) => {
  const isDemo = mode === 'demo';
  const areas = isDemo ? DEMO_AREAS : SUPPORT_AREAS;
  const modalTitle = isDemo ? 'Schedule a Demo' : 'Contact Support';
  const modalSubtitle = isDemo
    ? 'Share your details and areas of interest. A member of our team will get back to you within the next business day.'
    : 'Tell us what you need help with. Our support team will respond within one business day.';
  const emailSubject = isDemo ? 'Demo Request — HospitiumRIS' : 'Support Request — HospitiumRIS';
  const interestLabel = isDemo ? 'Area of Interest' : 'Area Requiring Support';
  const theme = useTheme();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    organisation: '',
    interests: [],
    consent: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleInterestToggle = (area) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(area)
        ? prev.interests.filter((i) => i !== area)
        : [...prev.interests, area],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(
      `First Name: ${form.firstName}\nLast Name: ${form.lastName}\nEmail: ${form.email}\nOrganisation: ${form.organisation}\n\n${isDemo ? 'Areas of Interest' : 'Areas Requiring Support'}:\n${form.interests.map((i) => `- ${i}`).join('\n')}`
    );
    window.location.href = `mailto:info@hospitiumris.org?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const handleClose = () => {
    setForm({ firstName: '', lastName: '', email: '', organisation: '', interests: [], consent: false });
    setSubmitted(false);
    onClose();
  };

  const isValid = form.firstName && form.lastName && form.email && form.consent;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock
      PaperProps={{
        sx: {
          borderRadius: 2,
          px: { xs: 1, sm: 2 },
          py: 1,
        },
      }}
    >
      <DialogTitle sx={{ pr: 6, pb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: theme.palette.text.primary }}>
          {modalTitle}
        </Typography>
        <Typography sx={{ fontSize: '0.875rem', color: theme.palette.text.secondary, mt: 0.5 }}>
          {modalSubtitle}
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ position: 'absolute', top: 14, right: 14, color: theme.palette.text.secondary }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {submitted ? (
          <Alert severity="success" sx={{ my: 2 }}>
            Thank you! Your demo request has been sent. We will be in touch shortly.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* Name row */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
              <TextField
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              fullWidth
              size="small"
              sx={{ mb: 2.5 }}
            />

            <TextField
              label="Organisation"
              name="organisation"
              value={form.organisation}
              onChange={handleChange}
              fullWidth
              size="small"
              sx={{ mb: 3 }}
            />

            {/* Areas of Interest */}
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 1,
              }}
            >
              {interestLabel} <Typography component="span" sx={{ color: theme.palette.error.main }}>*</Typography>
              <Typography component="span" sx={{ fontWeight: 400, color: theme.palette.text.secondary, ml: 0.5 }}>
                (select all that apply)
              </Typography>
            </Typography>

            <FormGroup sx={{ mb: 3 }}>
              {areas.map((area) => (
                <FormControlLabel
                  key={area}
                  control={
                    <Checkbox
                      checked={form.interests.includes(area)}
                      onChange={() => handleInterestToggle(area)}
                      size="small"
                      sx={{ py: 0.5 }}
                    />
                  }
                  label={
                    <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.primary }}>
                      {area}
                    </Typography>
                  }
                />
              ))}
            </FormGroup>

            <Divider sx={{ mb: 2.5 }} />

            {/* Consent */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.consent}
                  onChange={(e) => setForm((prev) => ({ ...prev, consent: e.target.checked }))}
                  size="small"
                />
              }
              label={
                <Typography sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary }}>
                  I agree to be contacted by the HospitiumRIS team regarding this request.
                </Typography>
              }
              sx={{ mb: 2, alignItems: 'flex-start' }}
            />

            <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.disabled, mb: 3, lineHeight: 1.6 }}>
              Your information will only be used to respond to your demo request and will not be shared with third parties.
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={!isValid}
                disableElevation
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': { backgroundColor: theme.palette.primary.dark },
                }}
              >
                Submit
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const SupportModal = ({ open, onClose }) => {
  const theme = useTheme();
  const [form, setForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    company: '',
    message: '',
    consent1: false,
    consent2: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent('Support Request — HospitiumRIS');
    const body = encodeURIComponent(
      `Email: ${form.email}\nFirst Name: ${form.firstName}\nLast Name: ${form.lastName}\nCompany: ${form.company}\n\nSupport Required:\n${form.message}`
    );
    window.location.href = `mailto:info@hospitiumris.org?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const handleClose = () => {
    setForm({ email: '', firstName: '', lastName: '', company: '', message: '', consent1: false, consent2: false });
    setSubmitted(false);
    onClose();
  };

  const isValid = form.email && form.firstName && form.lastName && form.company && form.message && form.consent1;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableScrollLock
      PaperProps={{ sx: { borderRadius: 2, px: { xs: 1, sm: 2 }, py: 1 } }}
    >
      <DialogTitle sx={{ pr: 6, pb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1.25rem', color: theme.palette.text.primary }}>
          Contact Support
        </Typography>
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{ position: 'absolute', top: 14, right: 14, color: theme.palette.text.secondary }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {submitted ? (
          <Alert severity="success" sx={{ my: 2 }}>
            Thank you! Your support request has been sent. We will get back to you within one business day.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              fullWidth
              size="small"
              sx={{ mb: 2.5 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
              <TextField
                label="First Name"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                fullWidth
                size="small"
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label="Company Name"
              name="company"
              value={form.company}
              onChange={handleChange}
              required
              fullWidth
              size="small"
              sx={{ mb: 2.5 }}
            />

            <TextField
              label="Please elaborate on the support required."
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              fullWidth
              multiline
              rows={4}
              size="small"
              sx={{ mb: 3 }}
            />

            <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, lineHeight: 1.7, mb: 2 }}>
              HospitiumRIS is committed to protecting and respecting your privacy, and we will only use your personal
              information to administer your account and to provide the products and services you requested from us.
              From time to time, we would like to contact you about our products and services, as well as other content
              that may be of interest to you. If you consent to us contacting you for this purpose, please tick below.
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.consent1}
                  onChange={(e) => setForm((prev) => ({ ...prev, consent1: e.target.checked }))}
                  size="small"
                />
              }
              label={
                <Typography sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary }}>
                  I agree to receive communications from HospitiumRIS regarding my support request.
                </Typography>
              }
              sx={{ mb: 1, alignItems: 'flex-start' }}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={form.consent2}
                  onChange={(e) => setForm((prev) => ({ ...prev, consent2: e.target.checked }))}
                  size="small"
                />
              }
              label={
                <Typography sx={{ fontSize: '0.85rem', color: theme.palette.text.secondary }}>
                  I agree to receive other communications from HospitiumRIS about products and services.
                </Typography>
              }
              sx={{ mb: 2, alignItems: 'flex-start' }}
            />

            <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.disabled, lineHeight: 1.6, mb: 0.75 }}>
              You can unsubscribe from these communications at any time. For more information on our privacy practices,
              please review our Privacy Policy.
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.disabled, lineHeight: 1.6, mb: 3 }}>
              By clicking submit below, you consent to allow HospitiumRIS to store and process the personal information
              submitted above to provide you the content requested.
            </Typography>

            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={!isValid}
                disableElevation
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  backgroundColor: theme.palette.primary.main,
                  '&:hover': { backgroundColor: theme.palette.primary.dark },
                }}
              >
                Submit
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const ContactPage = () => {
  const theme = useTheme();
  const [modalMode, setModalMode] = useState(null);
  const [supportOpen, setSupportOpen] = useState(false);

  const cards = [
    {
      title: 'Partnerships',
      description:
        "Schedule a live walkthrough with our team and see firsthand how HospitiumRIS can support your institution's research workflow and fit within your existing infrastructure.",
      action: 'Book a Demo',
      onClick: () => setModalMode('demo'),
    },
    {
      title: 'Support',
      description:
        'Have a question or running into an issue? Our support team is ready to assist and help you get the most out of every feature HospitiumRIS has to offer.',
      action: 'Contact Support',
      onClick: () => setSupportOpen(true),
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        pt: 14,
        pb: 12,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            sx={{
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: theme.palette.text.secondary,
              mb: 2,
            }}
          >
            Contact Us
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2.25rem', md: '3rem' },
              color: theme.palette.text.primary,
              lineHeight: 1.2,
              mb: 3,
            }}
          >
            Get in Touch
          </Typography>
          <Typography
            sx={{
              fontSize: '1rem',
              color: theme.palette.text.secondary,
              lineHeight: 1.8,
              maxWidth: 480,
              mx: 'auto',
            }}
          >
            Whether you want to schedule a live walkthrough, explore what HospitiumRIS
            can do for your institution, or just get in touch — we are here and ready to help.
          </Typography>
        </Box>

        {/* Cards */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
          {cards.map((card) => (
            <Box
              key={card.title}
              sx={{
                flex: '1 1 300px',
                maxWidth: 420,
                backgroundColor: theme.palette.mode === 'dark'
                  ? theme.palette.background.paper
                  : '#f5f6fa',
                borderRadius: 3,
                p: 5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '1.1rem' }}>
                {card.title}
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: theme.palette.text.secondary, lineHeight: 1.75, flexGrow: 1 }}>
                {card.description}
              </Typography>
              <Button
                variant="contained"
                onClick={card.onClick}
                disableElevation
                sx={{
                  mt: 1,
                  px: 3.5,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  '&:hover': { backgroundColor: theme.palette.primary.dark },
                }}
              >
                {card.action}
              </Button>
            </Box>
          ))}
        </Box>
      </Container>

      <ContactModal open={Boolean(modalMode)} onClose={() => setModalMode(null)} mode={modalMode} />
      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />
    </Box>
  );
};

export default ContactPage;
