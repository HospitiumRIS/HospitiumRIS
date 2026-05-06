'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  CheckCircle as ApprovedIcon,
  Cancel as DisapprovedIcon,
  Schedule as DeferredIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import ProposalReviewStatus from '@/components/Proposals/ProposalReviewStatus';

export default function ProposalReviewPage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [reviewForm, setReviewForm] = useState({
    decision: '',
    comments: '',
    conditions: '',
    reviewerName: '',
    reviewerEmail: '',
    reviewerRole: '',
  });

  useEffect(() => {
    fetchProposalAndStatus();
  }, [proposalId]);

  const fetchProposalAndStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch proposal
      const proposalRes = await fetch(`/api/proposals/${proposalId}`);
      if (!proposalRes.ok) throw new Error('Failed to fetch proposal');
      const proposalData = await proposalRes.json();
      setProposal(proposalData.proposal);

      // Fetch review status
      const statusRes = await fetch(`/api/proposals/${proposalId}/review-status`);
      if (!statusRes.ok) throw new Error('Failed to fetch review status');
      const statusData = await statusRes.json();
      
      if (statusData.tracking) {
        setTracking(statusData.tracking);
        
        // Find current stage
        const current = statusData.tracking.pipeline.stages.find(
          s => s.order === statusData.tracking.currentStageOrder
        );
        setCurrentStage(current);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.decision) {
      setError('Please select a decision');
      return;
    }

    if (!reviewForm.reviewerName || !reviewForm.reviewerEmail) {
      setError('Please provide your name and email');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await fetch(`/api/proposals/${proposalId}/review-stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageId: currentStage.id,
          ...reviewForm,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      const data = await response.json();
      setSuccess(data.message || 'Review submitted successfully');
      
      // Refresh data
      setTimeout(() => {
        fetchProposalAndStatus();
        setReviewForm({
          decision: '',
          comments: '',
          conditions: '',
          reviewerName: '',
          reviewerEmail: '',
          reviewerRole: '',
        });
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!proposal) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Proposal not found</Alert>
      </Box>
    );
  }

  if (!tracking) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">This proposal has not been submitted for review yet</Alert>
      </Box>
    );
  }

  const currentProgress = tracking.stageProgress.find(sp => sp.stageId === currentStage?.id);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#2D3748', mb: 1 }}>
          Review Proposal
        </Typography>
        <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
          {proposal.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={`Status: ${proposal.status}`} color="primary" />
          <Chip label={`PI: ${proposal.principalInvestigator}`} variant="outlined" />
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* Main Content */}
        <Box>
          {/* Current Stage Review Form */}
          {currentStage && currentProgress?.status === 'IN_PROGRESS' && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Current Stage: {currentStage.name}
              </Typography>
              {currentStage.description && (
                <Typography variant="body2" sx={{ color: '#666', mb: 3 }}>
                  {currentStage.description}
                </Typography>
              )}

              <Divider sx={{ my: 3 }} />

              {/* Reviewer Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  Reviewer Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Your Name *"
                    value={reviewForm.reviewerName}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewerName: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Your Email *"
                    type="email"
                    value={reviewForm.reviewerEmail}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewerEmail: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Your Role/Title"
                    value={reviewForm.reviewerRole}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewerRole: e.target.value })}
                    fullWidth
                  />
                </Box>
              </Box>

              {/* Decision */}
              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
                  Review Decision *
                </FormLabel>
                <RadioGroup
                  value={reviewForm.decision}
                  onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value })}
                >
                  <FormControlLabel
                    value="APPROVED"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ApprovedIcon sx={{ color: '#4caf50' }} />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>Approved</Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            You are clear to begin
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="APPROVED_WITH_CONTINGENCIES"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon sx={{ color: '#ff9800' }} />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>Approved with Contingencies</Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            You can start once you make minor changes
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="DEFERRED"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DeferredIcon sx={{ color: '#ff9800' }} />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>Deferred / Tabled</Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            Major questions; must resubmit and wait for next meeting
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="DISAPPROVED"
                    control={<Radio />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DisapprovedIcon sx={{ color: '#f44336' }} />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>Disapproved</Typography>
                          <Typography variant="caption" sx={{ color: '#666' }}>
                            The study is fundamentally flawed or unethical and cannot proceed
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>

              {/* Comments */}
              <TextField
                label="Comments *"
                multiline
                rows={4}
                value={reviewForm.comments}
                onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                placeholder="Provide detailed comments about your decision..."
                fullWidth
                sx={{ mb: 2 }}
              />

              {/* Conditions (if approved with contingencies) */}
              {reviewForm.decision === 'APPROVED_WITH_CONTINGENCIES' && (
                <TextField
                  label="Conditions for Approval"
                  multiline
                  rows={3}
                  value={reviewForm.conditions}
                  onChange={(e) => setReviewForm({ ...reviewForm, conditions: e.target.value })}
                  placeholder="List the specific conditions that must be met..."
                  fullWidth
                  sx={{ mb: 2 }}
                />
              )}

              <Button
                variant="contained"
                onClick={handleSubmitReview}
                disabled={submitting || !reviewForm.decision || !reviewForm.reviewerName || !reviewForm.reviewerEmail}
                fullWidth
                sx={{
                  backgroundColor: '#8b6cbc',
                  '&:hover': { backgroundColor: '#7a5aa8' },
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </Paper>
          )}

          {/* Proposal Details */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Proposal Details
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>
                  Abstract
                </Typography>
                <Typography variant="body2" dangerouslySetInnerHTML={{ __html: proposal.abstract || 'No abstract provided' }} />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>
                  Research Objectives
                </Typography>
                <Typography variant="body2" dangerouslySetInnerHTML={{ __html: proposal.researchObjectives || 'No objectives provided' }} />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>
                  Methodology
                </Typography>
                <Typography variant="body2" dangerouslySetInnerHTML={{ __html: proposal.methodology || 'No methodology provided' }} />
              </Box>

              {proposal.fundingSource && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>
                    Funding Source
                  </Typography>
                  <Typography variant="body2">{proposal.fundingSource}</Typography>
                </Box>
              )}

              {proposal.totalBudgetAmount && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#666' }}>
                    Total Budget
                  </Typography>
                  <Typography variant="body2">${parseFloat(proposal.totalBudgetAmount).toLocaleString()}</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Sidebar - Review Progress */}
        <Box>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <ProposalReviewStatus tracking={tracking} />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
