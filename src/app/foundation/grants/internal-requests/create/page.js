'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  FormHelperText,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Send as SendIcon,
  NoteAdd as NoteAddIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';

const PURPOSE_OPTIONS = [
  'Research',
  'Equipment',
  'Travel',
  'Training & Development',
  'Operations',
  'Infrastructure',
  'Community Outreach',
  'Other',
];

export default function CreateInternalGrantRequestPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantTitle: '',
    department: '',
    title: '',
    purpose: '',
    description: '',
    requestedAmount: '',
    projectStartDate: '',
    projectEndDate: '',
    justification: '',
    expectedOutcomes: '',
    budget: '',
    timeline: '',
  });

  const [formErrors, setFormErrors] = useState({});

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setFormErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.applicantName.trim()) errors.applicantName = 'Required';
    if (!formData.applicantEmail.trim()) errors.applicantEmail = 'Required';
    if (!formData.department.trim()) errors.department = 'Required';
    if (!formData.title.trim()) errors.title = 'Required';
    if (!formData.purpose) errors.purpose = 'Required';
    if (!formData.description.trim()) errors.description = 'Required';
    if (!formData.requestedAmount || parseFloat(formData.requestedAmount) <= 0) {
      errors.requestedAmount = 'Must be greater than 0';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (submit = false) => {
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/foundation/internal-grants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submit,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/foundation/grants/internal-requests');
        }, 1500);
      } else {
        setError(data.error || 'Failed to save request');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="New Internal Grant Request"
        description="Submit a funding request for research, equipment, training, or other institutional needs"
        icon={<NoteAddIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/foundation' },
          { label: 'Grants', path: '/foundation/grants' },
          { label: 'Internal Requests', path: '/foundation/grants/internal-requests' },
        ]}
      />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/foundation/grants/internal-requests')}
          sx={{ 
            mb: 3, 
            color: '#8b6cbc',
            '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.04)' }
          }}
        >
          Back to Internal Requests
        </Button>

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Request saved successfully! Redirecting...
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSave(true); }}>
          {/* Applicant Information */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ 
                bgcolor: 'rgba(139, 108, 188, 0.1)', 
                p: 1.5, 
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PersonIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748' }}>
                Applicant Information
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Full Name"
                  value={formData.applicantName}
                  onChange={handleChange('applicantName')}
                  required
                  error={!!formErrors.applicantName}
                  helperText={formErrors.applicantName}
                  sx={{ flex: '1 1 300px' }}
                />
                <TextField
                  label="Email Address"
                  type="email"
                  value={formData.applicantEmail}
                  onChange={handleChange('applicantEmail')}
                  required
                  error={!!formErrors.applicantEmail}
                  helperText={formErrors.applicantEmail}
                  sx={{ flex: '1 1 300px' }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Job Title / Position"
                  value={formData.applicantTitle}
                  onChange={handleChange('applicantTitle')}
                  sx={{ flex: '1 1 300px' }}
                />
                <TextField
                  label="Department"
                  value={formData.department}
                  onChange={handleChange('department')}
                  required
                  error={!!formErrors.department}
                  helperText={formErrors.department}
                  sx={{ flex: '1 1 300px' }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Request Details */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ 
                bgcolor: 'rgba(139, 108, 188, 0.1)', 
                p: 1.5, 
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DescriptionIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748' }}>
                Request Details
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Project / Request Title"
                value={formData.title}
                onChange={handleChange('title')}
                required
                error={!!formErrors.title}
                helperText={formErrors.title}
                fullWidth
                placeholder="Enter a clear, descriptive title for your funding request"
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl 
                  required 
                  error={!!formErrors.purpose}
                  sx={{ flex: '1 1 300px' }}
                >
                  <InputLabel>Purpose / Category</InputLabel>
                  <Select
                    value={formData.purpose}
                    label="Purpose / Category"
                    onChange={handleChange('purpose')}
                  >
                    {PURPOSE_OPTIONS.map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                  {formErrors.purpose && (
                    <FormHelperText>{formErrors.purpose}</FormHelperText>
                  )}
                </FormControl>

                <TextField
                  label="Requested Amount (USD)"
                  type="number"
                  value={formData.requestedAmount}
                  onChange={handleChange('requestedAmount')}
                  required
                  error={!!formErrors.requestedAmount}
                  helperText={formErrors.requestedAmount}
                  sx={{ flex: '1 1 300px' }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Box>

              <TextField
                label="Description & Overview"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleChange('description')}
                required
                error={!!formErrors.description}
                helperText={formErrors.description}
                fullWidth
                placeholder="Provide a comprehensive description of what this funding will be used for..."
              />

              <TextField
                label="Justification"
                multiline
                rows={4}
                value={formData.justification}
                onChange={handleChange('justification')}
                fullWidth
                placeholder="Explain why this funding is necessary and how it aligns with institutional goals..."
              />

              <TextField
                label="Expected Outcomes & Impact"
                multiline
                rows={4}
                value={formData.expectedOutcomes}
                onChange={handleChange('expectedOutcomes')}
                fullWidth
                placeholder="Describe the expected outcomes, deliverables, and impact of this project..."
              />
            </Box>
          </Paper>

          {/* Budget & Timeline */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ 
                bgcolor: 'rgba(139, 108, 188, 0.1)', 
                p: 1.5, 
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MoneyIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748' }}>
                Budget Breakdown
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Detailed Budget"
                multiline
                rows={6}
                value={formData.budget}
                onChange={handleChange('budget')}
                fullWidth
                placeholder="Provide a detailed breakdown of how the requested funds will be allocated (e.g., equipment: $X, personnel: $Y, materials: $Z)..."
              />
            </Box>
          </Paper>

          {/* Project Timeline */}
          <Paper sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ 
                bgcolor: 'rgba(139, 108, 188, 0.1)', 
                p: 1.5, 
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CalendarIcon sx={{ color: '#8b6cbc', fontSize: 28 }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748' }}>
                Project Timeline
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Project Start Date"
                  type="date"
                  value={formData.projectStartDate}
                  onChange={handleChange('projectStartDate')}
                  sx={{ flex: '1 1 300px' }}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Project End Date"
                  type="date"
                  value={formData.projectEndDate}
                  onChange={handleChange('projectEndDate')}
                  sx={{ flex: '1 1 300px' }}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <TextField
                label="Timeline & Milestones"
                multiline
                rows={4}
                value={formData.timeline}
                onChange={handleChange('timeline')}
                fullWidth
                placeholder="Outline key milestones and timeline for project completion..."
              />
            </Box>
          </Paper>

          {/* Action Buttons */}
          <Paper sx={{ 
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            bgcolor: 'rgba(139, 108, 188, 0.02)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#718096' }}>
                * Required fields must be completed before submission
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  sx={{
                    borderColor: '#8b6cbc',
                    color: '#8b6cbc',
                    '&:hover': {
                      borderColor: '#7a5caa',
                      bgcolor: 'rgba(139, 108, 188, 0.04)',
                    }
                  }}
                >
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                  disabled={saving}
                  sx={{
                    bgcolor: '#8b6cbc',
                    color: 'white',
                    px: 4,
                    '&:hover': {
                      bgcolor: '#7a5caa',
                    },
                    '&:disabled': {
                      bgcolor: 'rgba(139, 108, 188, 0.5)',
                    }
                  }}
                >
                  {saving ? 'Submitting...' : 'Submit Request'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </form>
      </Container>
    </Box>
  );
}
