'use client';

import React, { useState, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';

const ContactModal = ({ open, onClose, mode }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isDemo = mode === 'demo';
  
  const DEMO_AREAS = useMemo(() => [
    t('contact.demo_area_1'),
    t('contact.demo_area_2'),
    t('contact.demo_area_3'),
    t('contact.demo_area_4'),
    t('contact.demo_area_5'),
    t('contact.demo_area_6'),
    t('contact.demo_area_7'),
    t('contact.demo_area_8'),
  ], [t, i18n.language]);

  const SUPPORT_AREAS = useMemo(() => [
    t('contact.support_area_1'),
    t('contact.support_area_2'),
    t('contact.support_area_3'),
    t('contact.support_area_4'),
    t('contact.support_area_5'),
    t('contact.support_area_6'),
    t('contact.support_area_7'),
    t('contact.support_area_8'),
    t('contact.support_area_9'),
    t('contact.support_area_10'),
  ], [t, i18n.language]);

  const areas = isDemo ? DEMO_AREAS : SUPPORT_AREAS;
  const modalTitle = isDemo ? t('contact.demo_title') : t('contact.title');
  const modalSubtitle = isDemo ? t('contact.demo_subtitle') : t('contact.support_subtitle');
  const emailSubject = isDemo ? t('contact.demo_email_subject') : t('contact.support_email_subject');
  const interestLabel = isDemo ? t('contact.area_of_interest') : t('contact.area_requiring_support');
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
      `${t('contact.form_field_first_name')}: ${form.firstName}\n${t('contact.form_field_last_name')}: ${form.lastName}\n${t('contact.form_field_email')}: ${form.email}\n${t('contact.form_field_organisation')}: ${form.organisation}\n\n${isDemo ? t('contact.areas_of_interest') : t('contact.areas_requiring_support')}:\n${form.interests.map((i) => `- ${i}`).join('\n')}`
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
            {t('contact.success')}
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            {/* Name row */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
              <TextField
                label={t('contact.first_name')}
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                fullWidth
                size="small"
              />
              <TextField
                label={t('contact.last_name')}
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label={t('contact.email')}
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
              label={t('contact.organisation')}
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
                {t('contact.select_all_apply')}
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
                  {t('contact.consent_contact')}
                </Typography>
              }
              sx={{ mb: 2, alignItems: 'flex-start' }}
            />

            <Typography sx={{ fontSize: '0.8rem', color: theme.palette.text.disabled, mb: 3, lineHeight: 1.6 }}>
              {t('contact.privacy_notice_demo')}
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
                {t('common.submit')}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const SupportModal = ({ open, onClose }) => {
  const { t, i18n } = useTranslation();
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
    const subject = encodeURIComponent(t('contact.support_email_subject'));
    const body = encodeURIComponent(
      `${t('contact.form_field_email')}: ${form.email}\n${t('contact.form_field_first_name')}: ${form.firstName}\n${t('contact.form_field_last_name')}: ${form.lastName}\n${t('contact.form_field_company')}: ${form.company}\n\n${t('contact.area_requiring_support')}:\n${form.message}`
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
          {t('contact.support_title')}
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
            {t('contact.success')}
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              label={t('contact.email')}
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
                label={t('contact.first_name')}
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                fullWidth
                size="small"
              />
              <TextField
                label={t('contact.last_name')}
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                fullWidth
                size="small"
              />
            </Box>

            <TextField
              label={t('contact.company')}
              name="company"
              value={form.company}
              onChange={handleChange}
              required
              fullWidth
              size="small"
              sx={{ mb: 2.5 }}
            />

            <TextField
              label={t('contact.message_placeholder')}
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
              {t('contact.privacy_intro')}
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
                  {t('contact.consent_support_request')}
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
                  {t('contact.consent_marketing')}
                </Typography>
              }
              sx={{ mb: 2, alignItems: 'flex-start' }}
            />

            <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.disabled, lineHeight: 1.6, mb: 0.75 }}>
              {t('contact.privacy_unsubscribe')}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: theme.palette.text.disabled, lineHeight: 1.6, mb: 3 }}>
              {t('contact.privacy_consent_submit')}
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
                {t('common.submit')}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

const ContactPage = () => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [modalMode, setModalMode] = useState(null);
  const [supportOpen, setSupportOpen] = useState(false);

  const cards = useMemo(() => [
    {
      title: t('contact.card_partnerships_title'),
      description: t('contact.card_partnerships_desc'),
      action: t('contact.card_partnerships_action'),
      onClick: () => setModalMode('demo'),
    },
    {
      title: t('contact.card_support_title'),
      description: t('contact.card_support_desc'),
      action: t('contact.card_support_action'),
      onClick: () => setSupportOpen(true),
    },
  ], [t, i18n.language]);

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
            {t('contact.title')}
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
            {t('contact.subtitle')}
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
            {t('contact.page_subtitle')}
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
