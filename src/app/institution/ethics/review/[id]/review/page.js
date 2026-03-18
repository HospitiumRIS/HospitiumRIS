'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SubmitIcon,
  Shield as EthicsIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '../../../../../../components/common/PageHeader';
import { useAuth } from '../../../../../../components/AuthProvider';

const decisionOptions = [
  { value: 'APPROVED', label: 'Approve', color: '#4caf50', icon: <ApprovedIcon /> },
  { value: 'CONDITIONAL_APPROVAL', label: 'Conditional Approval', color: '#8bc34a', icon: <ApprovedIcon /> },
  { value: 'REVISION_REQUESTED', label: 'Request Revision', color: '#ff5722', icon: <WarningIcon /> },
  { value: 'REJECTED', label: 'Reject', color: '#f44336', icon: <RejectedIcon /> },
];

export default function EthicsReviewFormPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    reviewerName: '',
    reviewerRole: '',
    reviewerEmail: '',
    decision: '',
    overallComments: '',
    ethicalConcerns: '',
    riskAssessmentReview: '',
    consentReview: '',
    dataProtectionReview: '',
    participantSafetyReview: '',
    methodologyReview: '',
    recommendations: '',
    conditions: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchApplication();
    }
    if (user) {
      setFormData(prev => ({
        ...prev,
        reviewerName: user.name || '',
        reviewerEmail: user.email || '',
        reviewerRole: user.role || 'Ethics Committee Member',
      }));
    }
  }, [params.id, user]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ethics/applications/${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setApplication(data.application);
      } else {
        setError(data.error || 'Failed to fetch application');
      }
    } catch (error) {
      console.error('Error fetching ethics application:', error);
      setError('An error occurred while fetching the application');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.decision) {
      setError('Please select a decision');
      return;
    }

    if (!formData.overallComments) {
      setError('Please provide overall comments');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch(`/api/ethics/applications/${params.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          reviewerId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/institution/ethics/review/${params.id}`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('An error occurred while submitting the review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader
          title="Submit Ethics Review"
          description="Review and provide feedback on ethics application"
          icon={<EthicsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
            { label: 'Ethics Review', path: '/institution/ethics/review' },
          ]}
        />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            py: 8,
            bgcolor: 'white',
            borderRadius: 2,
            border: '1px solid rgba(0, 0, 0, 0.12)'
          }}>
            <CircularProgress sx={{ color: '#8b6cbc' }} />
            <Typography sx={{ mt: 2, color: '#718096' }}>Loading application...</Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error && !application) {
    return (
      <Box>
        <PageHeader
          title="Submit Ethics Review"
          description="Review and provide feedback on ethics application"
          icon={<EthicsIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
            { label: 'Ethics Review', path: '/institution/ethics/review' },
          ]}
        />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
          <Button
            startIcon={<BackIcon />}
            onClick={() => router.push('/institution/ethics/review')}
            sx={{ mt: 2, color: '#8b6cbc' }}
          >
            Back to Ethics Review
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Submit Ethics Review"
        description={application?.title || 'Review ethics application'}
        icon={<EthicsIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Ethics Review', path: '/institution/ethics/review' },
          { label: 'Application', path: `/institution/ethics/review/${params.id}` },
        ]}
      />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push(`/institution/ethics/review/${params.id}`)}
          sx={{ 
            mb: 3, 
            color: '#8b6cbc',
            '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.04)' }
          }}
        >
          Back to Application
        </Button>

        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Review submitted successfully! Redirecting...
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Application Summary */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          bgcolor: 'rgba(139, 108, 188, 0.02)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748', mb: 2 }}>
            Application Summary
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 300px' }}>
                <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500, mb: 0.5 }}>
                  Title
                </Typography>
                <Typography variant="body1" sx={{ color: '#2D3748', fontWeight: 600 }}>
                  {application.title}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500, mb: 0.5 }}>
                  Principal Investigator
                </Typography>
                <Typography variant="body1" sx={{ color: '#2D3748', fontWeight: 600 }}>
                  {application.principalInvestigator}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500, mb: 0.5 }}>
                  Research Type
                </Typography>
                <Chip 
                  label={application.researchType}
                  size="small"
                  sx={{ 
                    bgcolor: 'rgba(139, 108, 188, 0.1)', 
                    color: '#8b6cbc',
                    fontWeight: 600
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Review Form */}
        <form onSubmit={handleSubmit}>
          <Paper sx={{ 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
          }}>
            {/* Reviewer Information */}
            <Box sx={{ 
              p: 3, 
              bgcolor: 'rgba(139, 108, 188, 0.05)',
              borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ 
                  bgcolor: '#8b6cbc', 
                  p: 1.5, 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PersonIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748' }}>
                  Reviewer Information
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    label="Reviewer Name"
                    value={formData.reviewerName}
                    onChange={handleChange('reviewerName')}
                    required
                    fullWidth
                    sx={{ flex: '1 1 300px' }}
                  />
                  <TextField
                    label="Role/Position"
                    value={formData.reviewerRole}
                    onChange={handleChange('reviewerRole')}
                    required
                    fullWidth
                    sx={{ flex: '1 1 300px' }}
                  />
                </Box>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.reviewerEmail}
                  onChange={handleChange('reviewerEmail')}
                  required
                  fullWidth
                />
              </Box>
            </Box>

            {/* Decision */}
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
              <FormControl component="fieldset" fullWidth required>
                <FormLabel component="legend" sx={{ 
                  fontWeight: 700, 
                  fontSize: '1.1rem',
                  color: '#2D3748',
                  mb: 2
                }}>
                  Review Decision *
                </FormLabel>
                <RadioGroup
                  value={formData.decision}
                  onChange={handleChange('decision')}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {decisionOptions.map((option) => (
                      <Paper
                        key={option.value}
                        sx={{
                          p: 2,
                          border: formData.decision === option.value 
                            ? `2px solid ${option.color}` 
                            : '2px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: 2,
                          bgcolor: formData.decision === option.value 
                            ? `${option.color}10` 
                            : 'white',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: option.color,
                            bgcolor: `${option.color}08`,
                          }
                        }}
                      >
                        <FormControlLabel
                          value={option.value}
                          control={<Radio sx={{ color: option.color, '&.Mui-checked': { color: option.color } }} />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ color: option.color }}>
                                {option.icon}
                              </Box>
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                                {option.label}
                              </Typography>
                            </Box>
                          }
                          sx={{ m: 0, width: '100%' }}
                        />
                      </Paper>
                    ))}
                  </Box>
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Review Sections */}
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748', mb: 3 }}>
                Detailed Review Feedback
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Overall Comments */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
                    Overall Comments *
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096', mb: 1.5 }}>
                    Provide your general assessment of the ethics application
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    value={formData.overallComments}
                    onChange={handleChange('overallComments')}
                    required
                    fullWidth
                    placeholder="Enter your overall assessment of the application..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#8b6cbc' },
                        '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                      }
                    }}
                  />
                </Box>

                <Divider />

                {/* Expandable Review Sections */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      Ethical Concerns Assessment
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: '#718096', mb: 1.5 }}>
                      Identify and discuss any ethical concerns or issues with the proposed research
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      value={formData.ethicalConcerns}
                      onChange={handleChange('ethicalConcerns')}
                      fullWidth
                      placeholder="Describe any ethical concerns..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#8b6cbc' },
                          '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                        }
                      }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      Risk Assessment Review
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: '#718096', mb: 1.5 }}>
                      Evaluate the risk assessment, mitigation strategies, and risk-benefit ratio
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      value={formData.riskAssessmentReview}
                      onChange={handleChange('riskAssessmentReview')}
                      fullWidth
                      placeholder="Assess the risk evaluation and mitigation plans..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#8b6cbc' },
                          '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                        }
                      }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      Consent Process Review
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: '#718096', mb: 1.5 }}>
                      Review the informed consent process, documentation, and any waiver requests
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      value={formData.consentReview}
                      onChange={handleChange('consentReview')}
                      fullWidth
                      placeholder="Evaluate the consent process and documentation..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#8b6cbc' },
                          '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                        }
                      }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      Data Protection & Privacy Review
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: '#718096', mb: 1.5 }}>
                      Assess data collection, storage, security measures, and privacy protections
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      value={formData.dataProtectionReview}
                      onChange={handleChange('dataProtectionReview')}
                      fullWidth
                      placeholder="Review data protection and privacy measures..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#8b6cbc' },
                          '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                        }
                      }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      Participant Safety Review
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: '#718096', mb: 1.5 }}>
                      Evaluate measures to protect participant safety and wellbeing
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      value={formData.participantSafetyReview}
                      onChange={handleChange('participantSafetyReview')}
                      fullWidth
                      placeholder="Assess participant safety measures..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#8b6cbc' },
                          '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                        }
                      }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      Methodology Review
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: '#718096', mb: 1.5 }}>
                      Comment on the appropriateness and ethical soundness of the research methodology
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      value={formData.methodologyReview}
                      onChange={handleChange('methodologyReview')}
                      fullWidth
                      placeholder="Review the research methodology..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#8b6cbc' },
                          '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                        }
                      }}
                    />
                  </AccordionDetails>
                </Accordion>

                <Divider />

                {/* Recommendations */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
                    Recommendations
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#718096', mb: 1.5 }}>
                    Provide specific recommendations for improvement or modification
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    value={formData.recommendations}
                    onChange={handleChange('recommendations')}
                    fullWidth
                    placeholder="List your recommendations..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': { borderColor: '#8b6cbc' },
                        '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                      }
                    }}
                  />
                </Box>

                {/* Conditions (for conditional approval) */}
                {formData.decision === 'CONDITIONAL_APPROVAL' && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
                      Conditions for Approval *
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#718096', mb: 1.5 }}>
                      Specify the conditions that must be met for final approval
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      value={formData.conditions}
                      onChange={handleChange('conditions')}
                      required={formData.decision === 'CONDITIONAL_APPROVAL'}
                      fullWidth
                      placeholder="List the conditions that must be satisfied..."
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '&:hover fieldset': { borderColor: '#8b6cbc' },
                          '&.Mui-focused fieldset': { borderColor: '#8b6cbc' },
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>

            {/* Submit Button */}
            <Box sx={{ 
              p: 3, 
              bgcolor: 'rgba(139, 108, 188, 0.02)',
              borderTop: '1px solid rgba(0, 0, 0, 0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2
            }}>
              <Button
                variant="outlined"
                onClick={() => router.push(`/institution/ethics/review/${params.id}`)}
                disabled={submitting}
                sx={{
                  borderColor: '#8b6cbc',
                  color: '#8b6cbc',
                  '&:hover': {
                    borderColor: '#7a5caa',
                    bgcolor: 'rgba(139, 108, 188, 0.04)',
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SubmitIcon />}
                disabled={submitting}
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
                {submitting ? 'Submitting Review...' : 'Submit Review'}
              </Button>
            </Box>
          </Paper>
        </form>

        {/* Previous Reviews */}
        {application?.reviews && application.reviews.length > 0 && (
          <Paper sx={{ 
            mt: 3,
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748', mb: 3 }}>
              Previous Reviews ({application.reviews.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {application.reviews.map((review, index) => (
                <Paper key={index} sx={{ 
                  p: 2.5, 
                  bgcolor: 'rgba(139, 108, 188, 0.02)',
                  border: '1px solid rgba(139, 108, 188, 0.1)',
                  borderRadius: 2
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                        {review.reviewerName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#718096' }}>
                        {review.reviewerRole} • {format(new Date(review.reviewDate || review.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                    <Chip
                      label={review.decision?.replace(/_/g, ' ')}
                      sx={{
                        bgcolor: decisionOptions.find(d => d.value === review.decision)?.color || '#8b6cbc',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#2D3748', lineHeight: 1.7 }}>
                    {review.overallComments}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Paper>
        )}
      </Container>
    </Box>
  );
}
