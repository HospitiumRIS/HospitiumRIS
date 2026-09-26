'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  AssignmentTurnedIn as DeliverableIcon,
  Flag as MilestoneIcon,
  Home as HomeIcon,
  PersonAdd as AssignIcon,
  RateReview as ReviewIcon,
  Science as ScienceIcon,
  Security as EthicsIcon,
  Timeline as TimelineIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import PageHeader from '../../../../../components/common/PageHeader';
import ProposalReviewStatus from '../../../../../components/Proposals/ProposalReviewStatus';
import { useAuth } from '../../../../../components/AuthProvider';

const PURPLE = '#8b6cbc';
const sectionCardSx = {
  p: 2.5,
  borderRadius: 2,
  border: '1px solid',
  borderColor: 'divider',
  background: 'white',
  boxShadow: 'none',
};
const htmlSx = {
  color: '#334155',
  lineHeight: 1.7,
  fontSize: '0.95rem',
  '& p': { m: 0, mb: 1.25 },
  '& p:last-child': { mb: 0 },
  '& ul, & ol': { m: 0, pl: 2.5, mb: 1.25 },
  '& li': { mb: 0.5 },
  '& strong': { fontWeight: 700 },
};

const isEmptyHtml = (value) => !value || String(value).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim() === '';
const looksLikeHtml = (value) => typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value);

function HtmlContent({ value, empty = 'Not provided' }) {
  if (isEmptyHtml(value)) {
    return <Typography variant="body2" color="text.secondary">{empty}</Typography>;
  }
  if (!looksLikeHtml(value)) {
    return <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{value}</Typography>;
  }
  return <Box sx={htmlSx} dangerouslySetInnerHTML={{ __html: value }} />;
}

const formatDate = (value) => {
  if (!value) return 'Not set';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || amount === '') return 'Not set';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount));
  } catch {
    return `${amount}`;
  }
};

const statusChip = (status) => {
  const tones = {
    UNDER_REVIEW: { bg: PURPLE, color: '#fff' },
    APPROVED: { bg: '#16a34a', color: '#fff' },
    REJECTED: { bg: '#dc2626', color: '#fff' },
    REVISION_REQUESTED: { bg: '#d97706', color: '#fff' },
  };
  const tone = tones[status] || { bg: '#64748b', color: '#fff' };
  return <Chip size="small" label={String(status || '').replaceAll('_', ' ')} sx={{ bgcolor: tone.bg, color: tone.color, fontWeight: 700, textTransform: 'capitalize' }} />;
};

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
  const [activeTab, setActiveTab] = useState(0);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);
  const [decision, setDecision] = useState('');
  const [comments, setComments] = useState('');
  const [extra, setExtra] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) load();
  }, [params.id]);

  const timeline = useMemo(() => {
    if (!proposal) return [];
    const items = [];
    if (proposal.startDate) items.push({ id: 'start', kind: 'start', title: 'Project start', date: proposal.startDate });
    (proposal.milestones || []).forEach((item, index) => {
      items.push({ id: item.id || `ms-${index}`, kind: 'milestone', title: item.title || `Milestone ${index + 1}`, date: item.targetDate, description: item.description });
    });
    (proposal.deliverables || []).forEach((item, index) => {
      const linked = (proposal.milestones || []).find((milestone) => milestone.id === item.milestoneId);
      items.push({
        id: item.id || `dl-${index}`,
        kind: 'deliverable',
        title: item.title || `Deliverable ${index + 1}`,
        date: item.dueDate,
        description: item.description,
        meta: [item.type, linked?.title ? `Output of ${linked.title}` : null].filter(Boolean).join(' · '),
      });
    });
    if (proposal.endDate) items.push({ id: 'end', kind: 'end', title: 'Project end', date: proposal.endDate });
    return items.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
  }, [proposal]);

  const inviteReviewers = async () => {
    setInviting(true);
    setError('');
    try {
      const response = await fetch(`/api/proposals/${params.id}/reviewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: inviteEmails.split(/[,\s]+/), message: inviteMessage }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to invite reviewers');
      setReviewers(data.assignedReviewers || []);
      setInviteEmails('');
      setInviteMessage('');
      setNotice('Reviewer invitations sent. The researcher has been notified.');
    } catch (err) {
      setError(err.message);
    } finally {
      setInviting(false);
    }
  };

  const submitDecision = async () => {
    if (!decision || !comments.trim()) {
      setError('Choose a decision and add comments.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const reviewerName = `${user?.givenName || ''} ${user?.familyName || ''}`.trim() || user?.email || 'Research administrator';
      const response = await fetch(`/api/proposals/${params.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          overallComments: comments,
          rejectionReason: decision === 'rejected' ? extra : '',
          revisionRequirements: decision === 'requires_revision' ? extra : '',
          recommendation: comments,
          reviewer: reviewerName,
          reviewDate: new Date().toISOString(),
          sectionReviews: {},
          complianceScore: {},
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || data.details || 'Failed to submit review');
      setNotice('Review recorded. The researcher has been notified by email and in-app notification.');
      setDecision('');
      setComments('');
      setExtra('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: PURPLE }} />
      </Box>
    );
  }

  if (!proposal) {
    return (
      <Container maxWidth={false} sx={{ py: 4, maxWidth: '1600px' }}>
        <Alert severity="error">{error || 'Proposal not found'}</Alert>
      </Container>
    );
  }

  return (
    <>
      <PageHeader
        title={proposal.title}
        description={`${proposal.principalInvestigator || 'Principal investigator not set'} · ${(proposal.departments || []).join(', ') || 'No department'}`}
        icon={<ReviewIcon sx={{ fontSize: 32 }} />}
        breadcrumbs={[
          { label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' },
          { label: 'Proposal review', path: '/institution/proposals/review' },
          { label: 'Review' },
        ]}
        actionButton={
          <Stack direction="row" spacing={1.25} alignItems="center">
            {statusChip(proposal.status)}
            <Button
              variant="contained"
              startIcon={<BackIcon />}
              onClick={() => router.push('/institution/proposals/review')}
              sx={{ bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } }}
            >
              Back to list
            </Button>
          </Stack>
        }
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert> : null}
        {notice ? <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setNotice('')}>{notice}</Alert> : null}

        <Paper sx={{ ...sectionCardSx, mb: 2 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            {[
              ['Status', statusChip(proposal.status)],
              ['Timeline', `${formatDate(proposal.startDate)} - ${formatDate(proposal.endDate)}`],
              ['Budget', formatCurrency(proposal.totalBudgetAmount, proposal.budgetCurrency)],
              ['Reviewers invited', reviewers.length ? `${reviewers.length}` : 'None yet'],
            ].map(([label, value]) => (
              <Box key={label} sx={{ flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
                <Box sx={{ mt: 0.75 }}>{typeof value === 'string' ? <Typography variant="body2" sx={{ fontWeight: 700 }}>{value}</Typography> : value}</Box>
              </Box>
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ ...sectionCardSx, p: 0, mb: 2, overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant="scrollable"
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 52, color: '#64748b' },
              '& .Mui-selected': { color: `${PURPLE} !important` },
              '& .MuiTabs-indicator': { backgroundColor: PURPLE, height: 3 },
            }}
          >
            <Tab icon={<ScienceIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Overview" />
            <Tab icon={<TimelineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Timeline" />
            <Tab icon={<EthicsIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Ethics and files" />
            <Tab icon={<ReviewIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Review and assignment" />
          </Tabs>
        </Paper>

        {activeTab === 0 && (
          <Stack spacing={2}>
            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Study team</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Principal investigator:</strong> {proposal.principalInvestigator || 'Not set'}
                {proposal.principalInvestigatorOrcid ? ` (${proposal.principalInvestigatorOrcid})` : ''}
              </Typography>
              {(proposal.coInvestigators || []).length ? (
                <Stack spacing={0.75}>
                  {proposal.coInvestigators.map((person, index) => (
                    <Typography key={person.id || index} variant="body2">
                      {person.name || [person.givenName, person.familyName].filter(Boolean).join(' ') || 'Co-investigator'}
                      {person.role ? ` · ${person.role}` : ''}
                      {person.affiliation || person.institution ? ` · ${person.affiliation || person.institution}` : ''}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No co-investigators listed</Typography>
              )}
            </Paper>
            {(proposal.researchAreas || []).length ? (
              <Paper sx={sectionCardSx}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Research areas</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {proposal.researchAreas.map((area) => (
                    <Chip key={area} label={area} size="small" sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                  ))}
                </Stack>
              </Paper>
            ) : null}
            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Abstract</Typography>
              <HtmlContent value={proposal.abstract} />
            </Paper>
            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Objectives</Typography>
              <HtmlContent value={proposal.researchObjectives} />
            </Paper>
            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Methodology</Typography>
              <HtmlContent value={proposal.methodology} />
            </Paper>
          </Stack>
        )}

        {activeTab === 1 && (
          <Paper sx={sectionCardSx}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Project timeline</Typography>
            {timeline.map((item, index) => (
              <Box key={item.id} sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(PURPLE, 0.12), color: PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.kind === 'deliverable' ? <DeliverableIcon sx={{ fontSize: 16 }} /> : <MilestoneIcon sx={{ fontSize: 16 }} />}
                  </Box>
                  {index < timeline.length - 1 ? <Box sx={{ width: 2, flex: 1, minHeight: 24, bgcolor: alpha(PURPLE, 0.18), my: 0.5 }} /> : null}
                </Box>
                <Box sx={{ flex: 1, mb: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.title}</Typography>
                    <Typography variant="caption" sx={{ color: PURPLE, fontWeight: 700 }}>{formatDate(item.date)}</Typography>
                  </Stack>
                  {item.meta ? <Typography variant="caption" color="text.secondary">{item.meta}</Typography> : null}
                  {item.description ? <Box sx={{ mt: 1 }}><HtmlContent value={item.description} empty="" /></Box> : null}
                </Box>
              </Box>
            ))}
          </Paper>
        )}

        {activeTab === 2 && (
          <Stack spacing={2}>
            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Ethics</Typography>
              <Typography variant="body2"><strong>Status:</strong> {proposal.ethicsApprovalStatus || 'Not set'}</Typography>
              <Typography variant="body2"><strong>Reference:</strong> {proposal.ethicsApprovalReference || 'Not set'}</Typography>
              <Typography variant="body2"><strong>Committee:</strong> {proposal.ethicsCommittee || 'Not set'}</Typography>
              {proposal.ethicsLinks?.[0]?.ethicsApplication ? (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Linked application:</strong> {proposal.ethicsLinks[0].ethicsApplication.title}
                  {proposal.ethicsLinks[0].ethicsApplication.referenceNumber
                    ? ` (${proposal.ethicsLinks[0].ethicsApplication.referenceNumber})`
                    : ''}
                </Typography>
              ) : null}
              {proposal.ethicalConsiderationsOverview ? (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Considerations</Typography>
                  <HtmlContent value={proposal.ethicalConsiderationsOverview} />
                </Box>
              ) : null}
            </Paper>
            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Documents</Typography>
              {(proposal.documents || []).length ? (
                <Stack spacing={1}>
                  {proposal.documents.map((file, index) => (
                    <Stack key={index} direction="row" justifyContent="space-between" sx={{ px: 1.5, py: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{file.originalName || file.fileName || 'Document'}</Typography>
                        <Typography variant="caption" color="text.secondary">{file.category || 'File'}</Typography>
                      </Box>
                      <Button
                        size="small"
                        startIcon={<ViewIcon />}
                        disabled={!file.url}
                        onClick={() => file.url && window.open(file.url, '_blank', 'noopener')}
                        sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}
                      >
                        Open
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No documents linked</Typography>
              )}
            </Paper>
          </Stack>
        )}

        {activeTab === 3 && (
          <Stack spacing={2}>
            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Review pipeline</Typography>
              {tracking ? <ProposalReviewStatus tracking={tracking} /> : <Typography variant="body2" color="text.secondary">No pipeline assigned yet.</Typography>}
            </Paper>

            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Invite reviewers</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Send an email invitation with a link to this review. The researcher is notified that reviewers have been assigned.
              </Typography>
              {reviewers.length ? (
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                  {reviewers.map((email) => (
                    <Chip key={email} label={email} size="small" sx={{ bgcolor: alpha(PURPLE, 0.1), color: PURPLE, fontWeight: 700 }} />
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No reviewers invited yet.</Typography>
              )}
              <TextField
                fullWidth
                size="small"
                label="Reviewer emails"
                placeholder="reviewer@university.edu, colleague@hospital.org"
                value={inviteEmails}
                onChange={(event) => setInviteEmails(event.target.value)}
                sx={{ mb: 1.5 }}
              />
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="Optional message"
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value)}
                sx={{ mb: 1.5 }}
              />
              <Button
                variant="contained"
                startIcon={<AssignIcon />}
                disabled={inviting || !inviteEmails.trim()}
                onClick={inviteReviewers}
                sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}
              >
                {inviting ? 'Sending...' : 'Send invitations'}
              </Button>
            </Paper>

            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Record a decision</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The researcher receives an in-app notification and email when this decision is saved.
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                label="Decision"
                value={decision}
                onChange={(event) => setDecision(event.target.value)}
                sx={{ mb: 1.5 }}
              >
                <MenuItem value="approved">Approve</MenuItem>
                <MenuItem value="requires_revision">Request revision</MenuItem>
                <MenuItem value="rejected">Reject</MenuItem>
              </TextField>
              <TextField
                fullWidth
                multiline
                minRows={4}
                label="Comments"
                value={comments}
                onChange={(event) => setComments(event.target.value)}
                sx={{ mb: 1.5 }}
              />
              {decision === 'rejected' || decision === 'requires_revision' ? (
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label={decision === 'rejected' ? 'Rejection reason' : 'Revision requirements'}
                  value={extra}
                  onChange={(event) => setExtra(event.target.value)}
                  sx={{ mb: 1.5 }}
                />
              ) : null}
              <Button
                variant="contained"
                disabled={submitting}
                onClick={submitDecision}
                sx={{ bgcolor: PURPLE, textTransform: 'none', fontWeight: 700 }}
              >
                {submitting ? 'Saving...' : 'Save decision and notify researcher'}
              </Button>
            </Paper>

            <Paper sx={sectionCardSx}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Previous reviews</Typography>
              {reviews.length ? (
                <Stack spacing={1.25}>
                  {reviews.map((review) => (
                    <Box key={review.id} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{review.reviewerName}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDate(review.reviewDate)}</Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: PURPLE, fontWeight: 700 }}>{String(review.decision || '').replaceAll('_', ' ')}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>{review.overallComments}</Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">No written reviews yet.</Typography>
              )}
            </Paper>
          </Stack>
        )}
      </Container>
    </>
  );
}
