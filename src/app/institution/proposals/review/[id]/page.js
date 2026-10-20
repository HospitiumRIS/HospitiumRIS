'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Gavel as DecisionIcon,
  Home as HomeIcon,
  MarkEmailRead as InvitedIcon,
  PersonAdd as InviteIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../../components/common/PageHeader';
import ProposalReviewStatus from '../../../../../components/Proposals/ProposalReviewStatus';
import ProposalDetailView, {
  FieldLabel,
  PURPLE,
  SectionTitle,
  formatDate,
  sectionCardSx,
  statusChip,
} from '../../../../../components/Proposals/ProposalDetailView';
import {
  DECISIONS,
  InviteReviewersPanel,
  RecordDecisionPanel,
} from '../../../../../components/Proposals/ProposalReviewPanels';
import { useAuth } from '../../../../../components/AuthProvider';

const REVIEW_TAB = 6;
const DECIDED_STATUSES = new Set(['APPROVED', 'REJECTED']);

const decisionMeta = (value) => DECISIONS.find((item) => item.value === String(value || '').toLowerCase()) || null;

export default function InstitutionProposalReviewDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [viewKey, setViewKey] = useState(0);

  const load = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [proposalRes, trackingRes, reviewersRes, reviewsRes] = await Promise.all([
        fetch(`/api/proposals/${params.id}`),
        fetch(`/api/proposals/${params.id}/review-status`),
        fetch(`/api/proposals/${params.id}/reviewers`),
        fetch(`/api/proposals/${params.id}/review`),
      ]);
      const proposalData = await proposalRes.json();
      if (!proposalRes.ok || !proposalData.success) throw new Error(proposalData.error || 'Failed to load proposal');
      setProposal(proposalData.proposal);
      if (trackingRes.ok) setTracking((await trackingRes.json()).tracking || null);
      if (reviewersRes.ok) setReviewers((await reviewersRes.json()).assignedReviewers || []);
      if (reviewsRes.ok) setReviews((await reviewsRes.json()).reviews || []);
    } catch (err) {
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const reviewerName = `${user?.givenName || ''} ${user?.familyName || ''}`.trim() || user?.email || 'Research administrator';
  const latestReview = reviews.length
    ? [...reviews].sort((a, b) => new Date(b.reviewDate || 0) - new Date(a.reviewDate || 0))[0]
    : null;
  const alreadyDecided = DECIDED_STATUSES.has(proposal?.status);

  if (loading) {
    return (
      <Box sx={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: PURPLE }} />
      </Box>
    );
  }

  if (!proposal) {
    return (
      <Container maxWidth={false} sx={{ py: 4, maxWidth: '1600px', mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error || 'Proposal not found'}</Alert>
        <Button startIcon={<BackIcon />} onClick={() => router.push('/institution/proposals/review')} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>
          Back to proposal review
        </Button>
      </Container>
    );
  }

  const reviewContent = (
    <Stack spacing={2}>
      <Paper sx={sectionCardSx}>
        <SectionTitle>Review pipeline</SectionTitle>
        {tracking ? (
          <ProposalReviewStatus tracking={tracking} />
        ) : (
          <Typography variant="body2" color="text.secondary">No pipeline assigned yet.</Typography>
        )}
      </Paper>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
        <Paper sx={{ ...sectionCardSx, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
            <Box>
              <SectionTitle sx={{ mb: 0.25 }}>Reviewers</SectionTitle>
              <Typography variant="body2" color="text.secondary">
                {reviewers.length ? `${reviewers.length} invited` : 'No reviewers invited yet'}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<InviteIcon />}
              onClick={() => setInviteOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE, borderColor: alpha(PURPLE, 0.5), whiteSpace: 'nowrap', '&:hover': { borderColor: PURPLE, bgcolor: alpha(PURPLE, 0.06) } }}
            >
              Invite reviewers
            </Button>
          </Stack>
          {reviewers.length ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {reviewers.map((email) => (
                <Chip key={email} size="small" icon={<InvitedIcon />} label={email} sx={{ fontWeight: 600, bgcolor: alpha(PURPLE, 0.08), color: '#1e293b', '& .MuiChip-icon': { color: PURPLE } }} />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Invite external or internal reviewers by email. They receive a secure link to this proposal.
            </Typography>
          )}
        </Paper>

        <Paper sx={{ ...sectionCardSx, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 1.5 }}>
            <Box>
              <SectionTitle sx={{ mb: 0.25 }}>Decision</SectionTitle>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">Current status</Typography>
                {statusChip(proposal.status)}
              </Stack>
            </Box>
            <Button
              variant="contained"
              startIcon={<DecisionIcon />}
              onClick={() => setDecisionOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PURPLE, boxShadow: 'none', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#7a5cb0', boxShadow: 'none' } }}
            >
              {alreadyDecided ? 'Record new decision' : 'Record decision'}
            </Button>
          </Stack>
          {latestReview ? (
            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: decisionMeta(latestReview.decision)?.bg || '#f8fafc', border: '1px solid', borderColor: 'divider' }}>
              <FieldLabel>Latest decision</FieldLabel>
              <Typography variant="body2" sx={{ fontWeight: 700, color: decisionMeta(latestReview.decision)?.color || '#1e293b' }}>
                {decisionMeta(latestReview.decision)?.label || String(latestReview.decision || '').replaceAll('_', ' ')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {latestReview.reviewerName || 'Research administrator'} · {formatDate(latestReview.reviewDate)}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No decision recorded yet. The researcher is notified as soon as one is saved.
            </Typography>
          )}
        </Paper>
      </Stack>

      <Paper sx={sectionCardSx}>
        <SectionTitle>Previous reviews</SectionTitle>
        {reviews.length ? (
          <Stack spacing={1.25}>
            {[...reviews]
              .sort((a, b) => new Date(b.reviewDate || 0) - new Date(a.reviewDate || 0))
              .map((review) => {
                const meta = decisionMeta(review.decision);
                return (
                  <Box key={review.id} sx={{ p: 1.75, border: '1px solid', borderColor: 'divider', borderLeft: `4px solid ${meta?.color || PURPLE}`, borderRadius: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          size="small"
                          label={meta?.label || String(review.decision || '').replaceAll('_', ' ')}
                          sx={{ fontWeight: 700, bgcolor: meta?.bg || alpha(PURPLE, 0.1), color: meta?.color || PURPLE }}
                        />
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{review.reviewerName || 'Reviewer'}</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary">{formatDate(review.reviewDate)}</Typography>
                    </Stack>
                    {review.overallComments ? (
                      <Typography variant="body2" sx={{ mt: 1, color: '#334155', whiteSpace: 'pre-wrap' }}>{review.overallComments}</Typography>
                    ) : null}
                    {review.revisionRequirements ? (
                      <Box sx={{ mt: 1.25 }}>
                        <FieldLabel>Revision requirements</FieldLabel>
                        <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap' }}>{review.revisionRequirements}</Typography>
                      </Box>
                    ) : null}
                    {review.rejectionReason ? (
                      <Box sx={{ mt: 1.25 }}>
                        <FieldLabel>Reason for rejection</FieldLabel>
                        <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap' }}>{review.rejectionReason}</Typography>
                      </Box>
                    ) : null}
                  </Box>
                );
              })}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">No written reviews yet.</Typography>
        )}
      </Paper>
    </Stack>
  );

  return (
    <>
      <PageHeader
        title={proposal.title}
        description={`${proposal.principalInvestigator || 'Principal investigator not set'} · ${(proposal.departments || []).join(', ') || 'No department listed'}`}
        icon={<ReviewIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Proposal review', path: '/institution/proposals/review' },
          { label: 'Review' },
        ]}
        actionButton={
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
            {statusChip(proposal.status)}
            <Button
              variant="contained"
              startIcon={<BackIcon />}
              onClick={() => router.push('/institution/proposals/review')}
              sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              Back to list
            </Button>
            <Button
              variant="outlined"
              startIcon={<InviteIcon />}
              onClick={() => setInviteOpen(true)}
              sx={{ borderColor: 'white', color: 'white', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.12)' } }}
            >
              Invite reviewers
            </Button>
            <Button
              variant="outlined"
              startIcon={<DecisionIcon />}
              onClick={() => setDecisionOpen(true)}
              sx={{ borderColor: 'white', color: 'white', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.12)' } }}
            >
              Record decision
            </Button>
          </Stack>
        }
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}
        {notice ? <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setNotice('')}>{notice}</Alert> : null}

        <ProposalDetailView
          key={viewKey}
          proposal={proposal}
          tracking={tracking}
          initialTab={viewKey ? REVIEW_TAB : 0}
          onNavigate={(href) => router.push(href)}
          profileHref={(userId) => `/institution/researcher/${userId}`}
          ethicsHref={(ethicsId) => `/institution/ethics/review/${ethicsId}`}
          extraSummaryItems={[['Reviewers invited', reviewers.length ? `${reviewers.length}` : 'None yet']]}
          reviewTabLabel="Review and decision"
          reviewContent={reviewContent}
        />
      </Container>

      <InviteReviewersPanel
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        proposalId={params.id}
        proposalTitle={proposal.title}
        existingReviewers={reviewers}
        onInvited={(assigned, sent) => {
          setReviewers(assigned);
          setNotice(`${sent.length} invitation${sent.length === 1 ? '' : 's'} sent. The researcher has been notified.`);
        }}
      />

      <RecordDecisionPanel
        open={decisionOpen}
        onClose={() => setDecisionOpen(false)}
        proposalId={params.id}
        proposalTitle={proposal.title}
        reviewerName={reviewerName}
        onSaved={async (decision) => {
          setNotice(`Decision saved (${decisionMeta(decision)?.label || decision}). The researcher has been notified by email and in-app notification.`);
          await load({ silent: true });
          setViewKey((value) => value + 1);
        }}
      />
    </>
  );
}
