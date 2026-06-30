'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Typography, Button, Paper, TextField,
  FormControl, Select, MenuItem, Alert, CircularProgress,
  InputAdornment, FormHelperText, Stack, IconButton,
  Tooltip, LinearProgress, alpha, Divider,
} from '@mui/material';
import {
  ArrowBack as BackIcon, Save as SaveIcon, Send as SendIcon,
  NoteAdd as NoteAddIcon, Person as PersonIcon,
  Description as DescriptionIcon, AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon, CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as CircleIcon, Add as AddIcon, Delete as DeleteIcon,
  Biotech as ResearchIcon, Build as EquipmentIcon,
  FlightTakeoff as TravelIcon, MenuBook as TrainingIcon,
  Tune as OperationsIcon, AccountBalance as InfraIcon,
  People as OutreachIcon, Category as CategoryIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

// ── Constants ────────────────────────────────────────────────────────────────

const PURPOSE_CATEGORIES = [
  { value: 'Research', Icon: ResearchIcon, color: '#3b82f6', bg: '#eff6ff', description: 'Studies, trials & academic research' },
  { value: 'Equipment', Icon: EquipmentIcon, color: '#f59e0b', bg: '#fffbeb', description: 'Lab, medical & technical hardware' },
  { value: 'Travel', Icon: TravelIcon, color: '#0891b2', bg: '#ecfeff', description: 'Conferences, site visits & delegations' },
  { value: 'Training & Development', Icon: TrainingIcon, color: '#7c3aed', bg: '#f5f3ff', description: 'Skills, workshops & professional courses' },
  { value: 'Operations', Icon: OperationsIcon, color: '#6b7280', bg: '#f9fafb', description: 'Running costs, supplies & services' },
  { value: 'Infrastructure', Icon: InfraIcon, color: '#1d4ed8', bg: '#eff6ff', description: 'Facilities, IT systems & networks' },
  { value: 'Community Outreach', Icon: OutreachIcon, color: '#059669', bg: '#ecfdf5', description: 'Public health & community programmes' },
  { value: 'Other', Icon: CategoryIcon, color: '#64748b', bg: '#f8fafc', description: 'Other institutional funding needs' },
];

const BUDGET_CATEGORIES = [
  'Personnel', 'Equipment', 'Materials & Supplies', 'Travel & Accommodation',
  'Consultancy', 'Training', 'Software & Licences', 'Infrastructure', 'Indirect Costs', 'Other',
];

const SECTIONS = [
  { id: 'applicant',   label: 'Applicant',        Icon: PersonIcon,      required: true  },
  { id: 'overview',    label: 'Request Overview',  Icon: DescriptionIcon, required: true  },
  { id: 'description', label: 'Description',       Icon: NoteAddIcon,     required: true  },
  { id: 'budget',      label: 'Budget Breakdown',  Icon: MoneyIcon,       required: false },
  { id: 'timeline',    label: 'Timeline',          Icon: CalendarIcon,    required: false },
];

const EMPTY_LINE = () => ({ id: Date.now() + Math.random(), category: '', description: '', amount: '' });

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

// ── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, subtitle, color = '#8b6cbc', required }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3, pb: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(color, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon sx={{ color, fontSize: 22 }} />
      </Box>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
          {required && (
            <Typography sx={{ color: '#ef4444', fontSize: '0.70rem', fontWeight: 700, lineHeight: 1, px: 0.75, py: 0.25, bgcolor: '#fef2f2', borderRadius: 1 }}>
              Required
            </Typography>
          )}
        </Stack>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, fontSize: '0.83rem' }}>{subtitle}</Typography>
        )}
      </Box>
    </Box>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function CreateInternalGrantRequestPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    applicantName: '', applicantEmail: '', applicantTitle: '', department: '',
    title: '', purpose: '', description: '', requestedAmount: '',
    expectedOutcomes: '', timeline: '', projectStartDate: '', projectEndDate: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [budgetLines, setBudgetLines] = useState([EMPTY_LINE()]);

  // Section scroll refs
  const applicantRef   = useRef(null);
  const overviewRef    = useRef(null);
  const descriptionRef = useRef(null);
  const budgetRef      = useRef(null);
  const timelineRef    = useRef(null);

  const scrollTo = (id) => {
    const map = { applicant: applicantRef, overview: overviewRef, description: descriptionRef, budget: budgetRef, timeline: timelineRef };
    map[id]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Computed ──────────────────────────────────────────────────────────────

  const budgetTotal = useMemo(
    () => budgetLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0),
    [budgetLines],
  );

  const requestedAmt = parseFloat(formData.requestedAmount) || 0;
  const budgetDelta  = budgetTotal > 0 ? budgetTotal - requestedAmt : 0;

  const sectionComplete = useMemo(() => ({
    applicant:   !!(formData.applicantName.trim() && formData.applicantEmail.trim() && formData.department.trim()),
    overview:    !!(formData.title.trim() && formData.purpose && formData.requestedAmount && parseFloat(formData.requestedAmount) > 0),
    description: !!formData.description.trim(),
    budget:      budgetLines.some(l => l.description.trim() && parseFloat(l.amount) > 0),
    timeline:    !!(formData.projectStartDate || formData.projectEndDate),
  }), [formData, budgetLines]);

  const completedRequired = sectionComplete.applicant && sectionComplete.overview && sectionComplete.description;
  const totalComplete     = Object.values(sectionComplete).filter(Boolean).length;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
    setError('');
  };

  const handleBudgetChange = (id, field) => (e) =>
    setBudgetLines(prev => prev.map(l => l.id === id ? { ...l, [field]: e.target.value } : l));

  const addBudgetLine    = () => setBudgetLines(prev => [...prev, EMPTY_LINE()]);
  const removeBudgetLine = (id) => { if (budgetLines.length > 1) setBudgetLines(prev => prev.filter(l => l.id !== id)); };

  const validateForm = () => {
    const errors = {};
    if (!formData.applicantName.trim())  errors.applicantName  = 'Full name is required';
    if (!formData.applicantEmail.trim()) errors.applicantEmail = 'Email address is required';
    if (!formData.department.trim())     errors.department     = 'Department is required';
    if (!formData.title.trim())          errors.title          = 'Request title is required';
    if (!formData.purpose)               errors.purpose        = 'Please select a category';
    if (!formData.description.trim())    errors.description    = 'Description is required';
    if (!formData.requestedAmount || parseFloat(formData.requestedAmount) <= 0)
      errors.requestedAmount = 'Enter a positive amount';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const composeDescription = () => {
    const parts = [formData.description.trim()];
    if (formData.expectedOutcomes.trim())
      parts.push(`\n\nExpected Outcomes:\n${formData.expectedOutcomes.trim()}`);
    const filled = budgetLines.filter(l => l.description.trim() && parseFloat(l.amount) > 0);
    if (filled.length)
      parts.push(`\n\nBudget Breakdown:\n${filled.map(l => `• ${l.category || 'General'} — ${l.description}: $${Number(l.amount).toLocaleString()}`).join('\n')}\nTotal: ${fmt(budgetTotal)}`);
    if (formData.timeline.trim())
      parts.push(`\n\nTimeline & Milestones:\n${formData.timeline.trim()}`);
    return parts.join('');
  };

  const handleSave = async (submit = false) => {
    if (!validateForm()) {
      setError('Please complete all required fields before continuing.');
      if (!sectionComplete.applicant) scrollTo('applicant');
      else if (!sectionComplete.overview) scrollTo('overview');
      else scrollTo('description');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res  = await fetch('/api/foundation/internal-grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName:   formData.applicantName.trim(),
          applicantEmail:  formData.applicantEmail.trim(),
          applicantTitle:  formData.applicantTitle.trim() || undefined,
          department:      formData.department.trim(),
          title:           formData.title.trim(),
          purpose:         formData.purpose,
          description:     composeDescription(),
          requestedAmount: parseFloat(formData.requestedAmount),
          projectStartDate: formData.projectStartDate || undefined,
          projectEndDate:   formData.projectEndDate   || undefined,
          submit,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/foundation/grants/internal-requests'), 1800);
      } else {
        setError(data.error || 'Failed to save request. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      <PageHeader
        title="New Internal Grant Request"
        description="Submit a funding request for research, equipment, training, or other institutional needs"
        icon={<NoteAddIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Foundation', path: '/foundation' },
          { label: 'Grants', path: '/foundation/grants' },
          { label: 'Internal Requests', path: '/foundation/grants/internal-requests' },
          { label: 'New Request' },
        ]}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/foundation/grants/internal-requests')}
          sx={{ mb: 3, color: '#8b6cbc', '&:hover': { bgcolor: alpha('#8b6cbc', 0.04) } }}
        >
          Back to Internal Requests
        </Button>

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Request saved successfully! Redirecting to internal requests…
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* ── Two-column layout ── */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>

          {/* ─ Left Sidebar ─ */}
          <Box sx={{ width: { xs: '100%', md: 264 }, flexShrink: 0, position: { md: 'sticky' }, top: { md: 24 }, alignSelf: 'flex-start' }}>
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>

              {/* Sidebar header */}
              <Box sx={{ px: 2.5, py: 2, background: 'linear-gradient(135deg, rgba(139,108,188,0.07) 0%, rgba(160,132,209,0.04) 100%)', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1.25 }}>
                  Form Progress
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {totalComplete} of {SECTIONS.length} sections
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#8b6cbc', fontSize: '0.75rem' }}>
                    {Math.round((totalComplete / SECTIONS.length) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(totalComplete / SECTIONS.length) * 100}
                  sx={{ height: 5, borderRadius: 3, bgcolor: alpha('#8b6cbc', 0.1), '& .MuiLinearProgress-bar': { bgcolor: '#8b6cbc', borderRadius: 3 } }}
                />
              </Box>

              {/* Section list */}
              <Box sx={{ p: 1.5 }}>
                {SECTIONS.map(({ id, label, Icon, required }) => {
                  const done = sectionComplete[id];
                  return (
                    <Box
                      key={id}
                      onClick={() => scrollTo(id)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.1, borderRadius: 2, cursor: 'pointer', mb: 0.25, transition: 'all 0.15s', '&:hover': { bgcolor: alpha('#8b6cbc', 0.06) } }}
                    >
                      {done
                        ? <CheckCircleIcon sx={{ fontSize: 18, color: '#22c55e', flexShrink: 0 }} />
                        : <CircleIcon     sx={{ fontSize: 18, color: alpha('#8b6cbc', 0.28), flexShrink: 0 }} />
                      }
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.84rem', lineHeight: 1.2 }}>{label}</Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.68rem', color: done ? '#22c55e' : required ? '#f59e0b' : 'text.disabled' }}>
                          {done ? 'Complete' : required ? 'Required' : 'Optional'}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              <Divider />

              {/* Amount summary */}
              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.75 }}>
                  Requested Amount
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: requestedAmt > 0 ? '#8b6cbc' : 'text.disabled', fontSize: '1.3rem' }}>
                  {requestedAmt > 0 ? fmt(requestedAmt) : '—'}
                </Typography>
                {budgetTotal > 0 && (
                  <Box sx={{ mt: 0.75 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.72rem', color: 'text.secondary', display: 'block' }}>
                      Budget total: {fmt(budgetTotal)}
                    </Typography>
                    {Math.abs(budgetDelta) > 0 && (
                      <Typography variant="caption" sx={{ fontSize: '0.72rem', color: budgetDelta > 0 ? '#f59e0b' : '#22c55e', fontWeight: 700, display: 'block' }}>
                        {budgetDelta > 0 ? `Over by ${fmt(budgetDelta)}` : `Under by ${fmt(Math.abs(budgetDelta))}`}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Action buttons */}
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                <Button fullWidth variant="outlined" startIcon={<SaveIcon />} onClick={() => handleSave(false)} disabled={saving}
                  sx={{ borderColor: alpha('#8b6cbc', 0.4), color: '#8b6cbc', borderRadius: 2, fontWeight: 600 }}>
                  Save as Draft
                </Button>
                <Button fullWidth variant="contained"
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                  onClick={() => handleSave(true)} disabled={saving || !completedRequired}
                  sx={{ bgcolor: '#8b6cbc', borderRadius: 2, fontWeight: 600, '&:hover': { bgcolor: '#7a5cac' } }}>
                  {saving ? 'Submitting…' : 'Submit Request'}
                </Button>
                {!completedRequired && (
                  <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary', fontSize: '0.70rem', lineHeight: 1.4 }}>
                    Complete required sections to submit
                  </Typography>
                )}
              </Box>
            </Paper>
          </Box>

          {/* ─ Right form content ─ */}
          <Box sx={{ flex: 1, minWidth: 0 }}>

            {/* Section 1: Applicant */}
            <Paper
              ref={applicantRef} elevation={0}
              sx={{ border: '1px solid', borderColor: sectionComplete.applicant ? '#bbf7d0' : 'divider', borderLeft: `3.5px solid ${sectionComplete.applicant ? '#22c55e' : '#8b6cbc'}`, borderRadius: 3, p: 3, mb: 3 }}
            >
              <SectionHeader icon={PersonIcon} title="Applicant Information" subtitle="Contact details of the person submitting this request" required />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Box sx={{ flex: '1 1 220px' }}>
                  <TextField fullWidth label="Full Name *" value={formData.applicantName} onChange={handleChange('applicantName')}
                    error={!!formErrors.applicantName} helperText={formErrors.applicantName} placeholder="Dr. Jane Smith" />
                </Box>
                <Box sx={{ flex: '1 1 220px' }}>
                  <TextField fullWidth label="Email Address *" type="email" value={formData.applicantEmail} onChange={handleChange('applicantEmail')}
                    error={!!formErrors.applicantEmail} helperText={formErrors.applicantEmail} placeholder="j.smith@hospitium.org" />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 220px' }}>
                  <TextField fullWidth label="Job Title / Position" value={formData.applicantTitle} onChange={handleChange('applicantTitle')} placeholder="e.g. Principal Researcher" />
                </Box>
                <Box sx={{ flex: '1 1 220px' }}>
                  <TextField fullWidth label="Department *" value={formData.department} onChange={handleChange('department')}
                    error={!!formErrors.department} helperText={formErrors.department} placeholder="e.g. Clinical Research" />
                </Box>
              </Box>
            </Paper>

            {/* Section 2: Request Overview */}
            <Paper
              ref={overviewRef} elevation={0}
              sx={{ border: '1px solid', borderColor: sectionComplete.overview ? '#bbf7d0' : 'divider', borderLeft: `3.5px solid ${sectionComplete.overview ? '#22c55e' : '#8b6cbc'}`, borderRadius: 3, p: 3, mb: 3 }}
            >
              <SectionHeader icon={DescriptionIcon} title="Request Overview" subtitle="High-level details about what you are requesting funding for" required />

              <TextField
                fullWidth label="Project / Request Title *" value={formData.title} onChange={handleChange('title')}
                error={!!formErrors.title} helperText={formErrors.title || 'A clear, descriptive title for this request'}
                placeholder="e.g. AI-Assisted Diagnostic Imaging Study" sx={{ mb: 3 }}
              />

              {/* Purpose category picker */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75, color: formErrors.purpose ? 'error.main' : 'text.primary' }}>
                  Purpose / Category *
                </Typography>
                {formErrors.purpose && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mb: 1 }}>{formErrors.purpose}</Typography>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                  {PURPOSE_CATEGORIES.map(({ value, Icon, color, bg, description }) => {
                    const selected = formData.purpose === value;
                    return (
                      <Box
                        key={value}
                        onClick={() => { setFormData(p => ({ ...p, purpose: value })); setFormErrors(p => ({ ...p, purpose: '' })); }}
                        sx={{
                          flex: '1 1 148px', maxWidth: 210, p: 1.75, borderRadius: 2.5, cursor: 'pointer',
                          border: `2px solid ${selected ? color : 'transparent'}`,
                          bgcolor: selected ? bg : alpha(color, 0.04),
                          outline: selected ? 'none' : `1px solid ${alpha(color, 0.15)}`,
                          transition: 'all 0.15s',
                          '&:hover': { bgcolor: bg, outline: `1.5px solid ${alpha(color, 0.4)}` },
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Icon sx={{ fontSize: 17, color }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, color: selected ? color : 'text.primary', fontSize: '0.83rem', flex: 1 }}>{value}</Typography>
                          {selected && <CheckCircleIcon sx={{ fontSize: 14, color }} />}
                        </Stack>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.70rem', lineHeight: 1.35 }}>{description}</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Requested amount */}
              <Box sx={{ maxWidth: 300 }}>
                <TextField
                  fullWidth label="Requested Amount (USD) *" type="number"
                  value={formData.requestedAmount} onChange={handleChange('requestedAmount')}
                  error={!!formErrors.requestedAmount} helperText={formErrors.requestedAmount || 'Total funding amount being requested'}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              </Box>
            </Paper>

            {/* Section 3: Description */}
            <Paper
              ref={descriptionRef} elevation={0}
              sx={{ border: '1px solid', borderColor: sectionComplete.description ? '#bbf7d0' : 'divider', borderLeft: `3.5px solid ${sectionComplete.description ? '#22c55e' : '#8b6cbc'}`, borderRadius: 3, p: 3, mb: 3 }}
            >
              <SectionHeader icon={NoteAddIcon} title="Description & Justification" subtitle="Explain the need, approach, and expected impact of this request" required />
              <Stack spacing={3}>
                <TextField
                  fullWidth multiline rows={5}
                  label="Description & Justification *"
                  value={formData.description} onChange={handleChange('description')}
                  error={!!formErrors.description}
                  helperText={formErrors.description || `${formData.description.length} characters — describe what will be done, how funds will be used, and why this is needed`}
                  placeholder="Provide a comprehensive description of this funding request — what will be done, how the funds will be used, and how it aligns with institutional goals…"
                />
                <TextField
                  fullWidth multiline rows={4}
                  label="Expected Outcomes & Impact"
                  value={formData.expectedOutcomes} onChange={handleChange('expectedOutcomes')}
                  helperText={`${formData.expectedOutcomes.length} characters — optional but highly recommended`}
                  placeholder="Describe the expected deliverables, measurable outcomes, and broader impact of this project…"
                />
              </Stack>
            </Paper>

            {/* Section 4: Budget Breakdown */}
            <Paper
              ref={budgetRef} elevation={0}
              sx={{ border: '1px solid', borderColor: sectionComplete.budget ? '#bbf7d0' : 'divider', borderLeft: `3.5px solid ${sectionComplete.budget ? '#22c55e' : alpha('#059669', 0.4)}`, borderRadius: 3, p: 3, mb: 3 }}
            >
              <SectionHeader icon={MoneyIcon} title="Budget Breakdown" subtitle="Itemise how the requested funds will be allocated — optional but recommended" color="#059669" />

              {/* Column headers */}
              <Box sx={{ display: 'flex', gap: 1.5, px: 0.5, mb: 1 }}>
                <Typography variant="caption" sx={{ flex: '0 0 168px', fontWeight: 600, color: 'text.secondary', fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</Typography>
                <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, color: 'text.secondary', fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</Typography>
                <Typography variant="caption" sx={{ flex: '0 0 136px', fontWeight: 600, color: 'text.secondary', fontSize: '0.70rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount (USD)</Typography>
                <Box sx={{ width: 36 }} />
              </Box>

              <Stack spacing={1.25} sx={{ mb: 2 }}>
                {budgetLines.map((line) => (
                  <Box key={line.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <FormControl size="small" sx={{ flex: '0 0 168px' }}>
                      <Select value={line.category} onChange={handleBudgetChange(line.id, 'category')} displayEmpty sx={{ borderRadius: 2 }}>
                        <MenuItem value=""><em style={{ color: '#94a3b8', fontStyle: 'italic' }}>Category</em></MenuItem>
                        {BUDGET_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <TextField
                      size="small" placeholder="Brief description of this line item"
                      value={line.description} onChange={handleBudgetChange(line.id, 'description')}
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <TextField
                      size="small" type="number" placeholder="0"
                      value={line.amount} onChange={handleBudgetChange(line.id, 'amount')}
                      sx={{ flex: '0 0 136px', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    />
                    <Tooltip title="Remove line">
                      <span>
                        <IconButton size="small" onClick={() => removeBudgetLine(line.id)} disabled={budgetLines.length === 1}
                          sx={{ mt: 0.5, color: 'error.main', '&:disabled': { color: 'action.disabled' } }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                ))}
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Button size="small" startIcon={<AddIcon />} onClick={addBudgetLine}
                  sx={{ color: '#059669', border: `1px solid ${alpha('#059669', 0.4)}`, borderRadius: 2, px: 2, '&:hover': { bgcolor: alpha('#059669', 0.05) } }}>
                  Add Line Item
                </Button>

                {budgetTotal > 0 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.25, borderRadius: 2, bgcolor: alpha('#059669', 0.05), border: `1px solid ${alpha('#059669', 0.15)}` }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Budget Total</Typography>
                      <Typography sx={{ fontWeight: 800, color: '#059669', fontSize: '1rem', lineHeight: 1.2 }}>{fmt(budgetTotal)}</Typography>
                    </Box>
                    {requestedAmt > 0 && (
                      <>
                        <Divider orientation="vertical" flexItem />
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Requested</Typography>
                          <Typography sx={{ fontWeight: 800, color: '#8b6cbc', fontSize: '1rem', lineHeight: 1.2 }}>{fmt(requestedAmt)}</Typography>
                        </Box>
                        {Math.abs(budgetDelta) > 0 && (
                          <>
                            <Divider orientation="vertical" flexItem />
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Difference</Typography>
                              <Typography sx={{ fontWeight: 700, color: budgetDelta > 0 ? '#ef4444' : '#22c55e', fontSize: '0.92rem', lineHeight: 1.2 }}>
                                {budgetDelta > 0 ? '+' : ''}{fmt(budgetDelta)}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </>
                    )}
                  </Box>
                )}
              </Box>

              {budgetDelta > 100 && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                  Budget total ({fmt(budgetTotal)}) exceeds requested amount ({fmt(requestedAmt)}) by {fmt(budgetDelta)}. Please review your figures.
                </Alert>
              )}
            </Paper>

            {/* Section 5: Timeline */}
            <Paper
              ref={timelineRef} elevation={0}
              sx={{ border: '1px solid', borderColor: sectionComplete.timeline ? '#bbf7d0' : 'divider', borderLeft: `3.5px solid ${sectionComplete.timeline ? '#22c55e' : alpha('#0891b2', 0.4)}`, borderRadius: 3, p: 3, mb: 3 }}
            >
              <SectionHeader icon={CalendarIcon} title="Project Timeline" subtitle="Planned start/end dates and key milestones — optional" color="#0891b2" />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 200px' }}>
                  <TextField fullWidth label="Project Start Date" type="date" value={formData.projectStartDate} onChange={handleChange('projectStartDate')} InputLabelProps={{ shrink: true }} />
                </Box>
                <Box sx={{ flex: '1 1 200px' }}>
                  <TextField fullWidth label="Project End Date" type="date" value={formData.projectEndDate} onChange={handleChange('projectEndDate')} InputLabelProps={{ shrink: true }} />
                </Box>
              </Box>
              <TextField
                fullWidth multiline rows={4}
                label="Key Milestones & Timeline"
                value={formData.timeline} onChange={handleChange('timeline')}
                helperText="Outline key milestones, deliverable dates, and project phases"
                placeholder={'Month 1–2: Procurement and setup\nMonth 3: Pilot phase\nMonth 6: Interim review\nMonth 12: Final report and close'}
              />
            </Paper>

            {/* Bottom action bar */}
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, px: 3, py: 2.5, bgcolor: alpha('#8b6cbc', 0.02) }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {completedRequired
                      ? <><CheckCircleIcon sx={{ fontSize: 16, color: '#22c55e' }} />Ready to submit</>
                      : 'Complete required sections to submit'
                    }
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                    {totalComplete} of {SECTIONS.length} sections complete · Required: Applicant, Overview, Description
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button variant="outlined" startIcon={<SaveIcon />} onClick={() => handleSave(false)} disabled={saving}
                    sx={{ borderColor: alpha('#8b6cbc', 0.4), color: '#8b6cbc', borderRadius: 2, fontWeight: 600 }}>
                    Save as Draft
                  </Button>
                  <Button variant="contained"
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                    onClick={() => handleSave(true)} disabled={saving || !completedRequired}
                    sx={{ bgcolor: '#8b6cbc', borderRadius: 2, fontWeight: 600, px: 3, '&:hover': { bgcolor: '#7a5cac' } }}>
                    {saving ? 'Submitting…' : 'Submit Request'}
                  </Button>
                </Box>
              </Box>
            </Paper>

          </Box>
        </Box>
      </Container>
    </Box>
  );
}
