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
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  FormHelperText,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Send as SubmitIcon,
  RateReview as ReviewIcon,
  Home as HomeIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Warning as WarningIcon,
  ArrowForward as ForwardIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import PageHeader from '@/components/common/PageHeader';

const DECISION_OPTIONS = [
  { value: 'forward', label: 'Forward to Next Stage', color: '#2196f3', icon: <ForwardIcon /> },
  { value: 'approved', label: 'Approve', color: '#4caf50', icon: <ApprovedIcon /> },
  { value: 'rejected', label: 'Reject', color: '#f44336', icon: <RejectedIcon /> },
  { value: 'revision_requested', label: 'Request Revision', color: '#ff9800', icon: <WarningIcon /> },
];

const STAGE_LABELS = {
  intake: 'Intake',
  initial_review: 'Initial Review',
  committee_review: 'Committee Review',
  final_decision: 'Final Decision',
};

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

export default function SubmitReviewPage() {
  const router = useRouter();
  const params = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [reviewData, setReviewData] = useState({
    reviewerName: '',
    reviewerEmail: '',
    decision: '',
    comments: '',
    approvedAmount: '',
    decisionNotes: '',
    revisionNotes: '',
    reportingRequired: false,
    reportDueDate: '',
    budgetComments: '',
    timelineComments: '',
    riskAssessment: '',
    recommendations: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (params.id) {
      fetchRequest();
    }
  }, [params.id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/foundation/internal-grants?id=${params.id}`);
      const data = await response.json();
      
      if (data.success) {
        setRequest(data.request);
      } else {
        setError(data.error || 'Failed to fetch request');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setReviewData(prev => ({
      ...prev,
      [field]: value
    }));
    setFormErrors(prev => ({
      ...prev,
      [field]: ''
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!reviewData.reviewerName.trim()) errors.reviewerName = 'Required';
    if (!reviewData.decision) errors.decision = 'Required';
    if (!reviewData.comments.trim()) errors.comments = 'Required';
    if (reviewData.decision === 'approved' && (!reviewData.approvedAmount || parseFloat(reviewData.approvedAmount) <= 0)) {
      errors.approvedAmount = 'Required for approval';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/foundation/internal-grants', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: params.id,
          action: 'review',
          stage: request.stage,
          ...reviewData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/foundation/grants/internal-requests/review');
        }, 1500);
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <PageHeader
          title="Submit Review"
          description="Review and evaluate internal grant request"
          icon={<ReviewIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Internal Requests', path: '/foundation/grants/internal-requests' },
            { label: 'Review', path: '/foundation/grants/internal-requests/review' },
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
            <Typography sx={{ mt: 2, color: '#718096' }}>Loading request...</Typography>
          </Box>
        </Container>
      </Box>
    );
  }

  if (error && !request) {
    return (
      <Box>
        <PageHeader
          title="Submit Review"
          description="Review and evaluate internal grant request"
          icon={<ReviewIcon sx={{ fontSize: 32 }} />}
          breadcrumbs={[
            { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/foundation' },
            { label: 'Grants', path: '/foundation/grants' },
            { label: 'Internal Requests', path: '/foundation/grants/internal-requests' },
            { label: 'Review', path: '/foundation/grants/internal-requests/review' },
          ]}
        />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
          <Button
            startIcon={<BackIcon />}
            onClick={() => router.push('/foundation/grants/internal-requests/review')}
            sx={{ mt: 2, color: '#8b6cbc' }}
          >
            Back to Review
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Submit Review"
        description={request?.title || 'Review internal grant request'}
        icon={<ReviewIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/foundation' },
          { label: 'Grants', path: '/foundation/grants' },
          { label: 'Internal Requests', path: '/foundation/grants/internal-requests' },
          { label: 'Review', path: '/foundation/grants/internal-requests/review' },
        ]}
      />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push(`/foundation/grants/internal-requests/review/${params.id}`)}
          sx={{ 
            mb: 3, 
            color: '#8b6cbc',
            '&:hover': { bgcolor: 'rgba(139, 108, 188, 0.04)' }
          }}
        >
          Back to Request Details
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

        {/* Request Summary */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          bgcolor: 'rgba(139, 108, 188, 0.02)'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748', mb: 2 }}>
            Request Summary
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: '1 1 300px' }}>
                <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500, mb: 0.5 }}>
                  Title
                </Typography>
                <Typography variant="body1" sx={{ color: '#2D3748', fontWeight: 600 }}>
                  {request.title}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 200px' }}>
                <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500, mb: 0.5 }}>
                  Applicant
                </Typography>
                <Typography variant="body1" sx={{ color: '#2D3748', fontWeight: 600 }}>
                  {request.applicantName}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 150px' }}>
                <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500, mb: 0.5 }}>
                  Requested Amount
                </Typography>
                <Typography variant="h6" sx={{ color: '#8b6cbc', fontWeight: 700 }}>
                  {fmt(request.requestedAmount)}
                </Typography>
              </Box>
              <Box sx={{ flex: '1 1 150px' }}>
                <Typography variant="body2" sx={{ color: '#718096', fontWeight: 500, mb: 0.5 }}>
                  Current Stage
                </Typography>
                <Chip 
                  label={STAGE_LABELS[request.stage]}
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
                    value={reviewData.reviewerName}
                    onChange={handleChange('reviewerName')}
                    required
                    error={!!formErrors.reviewerName}
                    helperText={formErrors.reviewerName}
                    sx={{ flex: '1 1 300px' }}
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={reviewData.reviewerEmail}
                    onChange={handleChange('reviewerEmail')}
                    sx={{ flex: '1 1 300px' }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Decision */}
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
              <FormControl component="fieldset" fullWidth required error={!!formErrors.decision}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2D3748', mb: 2 }}>
                  Review Decision *
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {DECISION_OPTIONS.map((option) => (
                    <Paper
                      key={option.value}
                      onClick={() => handleChange('decision')({ target: { value: option.value } })}
                      sx={{
                        p: 2,
                        border: reviewData.decision === option.value 
                          ? `2px solid ${option.color}` 
                          : '2px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: 2,
                        bgcolor: reviewData.decision === option.value 
                          ? `${option.color}10` 
                          : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: option.color,
                          bgcolor: `${option.color}08`,
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ color: option.color }}>
                          {option.icon}
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                          {option.label}
                        </Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
                {formErrors.decision && (
                  <FormHelperText>{formErrors.decision}</FormHelperText>
                )}
              </FormControl>
            </Box>

            {/* Review Details */}
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748', mb: 3 }}>
                Review Feedback
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Overall Comments */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
                    Overall Comments *
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    value={reviewData.comments}
                    onChange={handleChange('comments')}
                    required
                    error={!!formErrors.comments}
                    helperText={formErrors.comments}
                    fullWidth
                    placeholder="Provide your overall assessment of the request..."
                  />
                </Box>

                {/* Approved Amount (if approving) */}
                {reviewData.decision === 'approved' && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
                      Approved Amount *
                    </Typography>
                    <TextField
                      type="number"
                      value={reviewData.approvedAmount}
                      onChange={handleChange('approvedAmount')}
                      required
                      error={!!formErrors.approvedAmount}
                      helperText={formErrors.approvedAmount}
                      fullWidth
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Box>
                )}

                <Divider />

                {/* Expandable Sections */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      Budget Assessment
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      multiline
                      rows={4}
                      value={reviewData.budgetComments}
                      onChange={handleChange('budgetComments')}
                      fullWidth
                      placeholder="Comment on the budget breakdown and justification..."
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      Timeline & Feasibility
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      multiline
                      rows={4}
                      value={reviewData.timelineComments}
                      onChange={handleChange('timelineComments')}
                      fullWidth
                      placeholder="Assess the proposed timeline and project feasibility..."
                    />
                  </AccordionDetails>
                </Accordion>

                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748' }}>
                      Risk Assessment
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TextField
                      multiline
                      rows={4}
                      value={reviewData.riskAssessment}
                      onChange={handleChange('riskAssessment')}
                      fullWidth
                      placeholder="Identify potential risks and concerns..."
                    />
                  </AccordionDetails>
                </Accordion>

                <Divider />

                {/* Recommendations */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
                    Recommendations
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    value={reviewData.recommendations}
                    onChange={handleChange('recommendations')}
                    fullWidth
                    placeholder="Provide specific recommendations or suggestions..."
                  />
                </Box>

                {/* Decision Notes */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
                    Decision Notes
                  </Typography>
                  <TextField
                    multiline
                    rows={3}
                    value={reviewData.decisionNotes}
                    onChange={handleChange('decisionNotes')}
                    fullWidth
                    placeholder="Additional notes regarding your decision..."
                  />
                </Box>

                {/* Revision Notes (if requesting revision) */}
                {reviewData.decision === 'revision_requested' && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
                      Revision Requirements
                    </Typography>
                    <TextField
                      multiline
                      rows={4}
                      value={reviewData.revisionNotes}
                      onChange={handleChange('revisionNotes')}
                      fullWidth
                      placeholder="Specify what needs to be revised or improved..."
                    />
                  </Box>
                )}

                {/* Reporting Requirements (if approving) */}
                {reviewData.decision === 'approved' && (
                  <>
                    <Divider />
                    <Box>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={reviewData.reportingRequired}
                            onChange={handleChange('reportingRequired')}
                            sx={{ color: '#8b6cbc', '&.Mui-checked': { color: '#8b6cbc' } }}
                          />
                        }
                        label="Reporting Required"
                      />
                    </Box>
                    {reviewData.reportingRequired && (
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
                          Report Due Date
                        </Typography>
                        <TextField
                          type="date"
                          value={reviewData.reportDueDate}
                          onChange={handleChange('reportDueDate')}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                    )}
                  </>
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
                onClick={() => router.push('/foundation/grants/internal-requests/review')}
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
        {request?.reviews && request.reviews.length > 0 && (
          <Paper sx={{ 
            mt: 3,
            p: 3, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(0, 0, 0, 0.08)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D3748', mb: 3 }}>
              Previous Reviews ({request.reviews.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {request.reviews.map((review, index) => (
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
                        {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                    </Box>
                    <Chip
                      label={review.decision?.replace(/_/g, ' ')}
                      sx={{
                        bgcolor: DECISION_OPTIONS.find(d => d.value === review.decision)?.color || '#8b6cbc',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#2D3748', lineHeight: 1.7 }}>
                    {review.comments}
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
