'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Alert,
  Avatar,
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
  Assignment as ProjectIcon,
  Gavel as DecisionIcon,
  History as HistoryIcon,
  Home as HomeIcon,
  MarkEmailRead as InvitedIcon,
  PersonAdd as InviteIcon,
  RateReview as ReviewIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/common/PageHeader';
import StatusPill, { humanizeStatus } from '@/components/common/StatusPill';
import ProposalOverview, { ProposalHeaderMeta } from '@/components/Proposals/ProposalOverview';
import { PROPOSAL_STATUS_TONE } from '@/components/Proposals/ProposalStatusCell';
import { DECISIONS, InviteReviewersPanel, RecordDecisionPanel } from '@/components/Proposals/ProposalReviewPanels';
import { useAuth } from '@/components/AuthProvider';

const PURPLE = '#8b6cbc';
const INK = '#1e293b';
const DECIDED = new Set(['APPROVED', 'REJECTED']);
const DONE_LABEL = { approved: 'Approved', requires_revision: 'Revision requested', rejected: 'Rejected' };
const cardSx = { p: { xs: 2, md: 2.5 }, borderRadius: 2.5, border: '1px solid', borderColor: 'divider', boxShadow: 'none', minWidth: 0 };
const whiteBtn = { bgcolor: 'white', color: PURPLE, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#f5f5f5' } };
const ghostBtn = { color: 'white', borderColor: 'rgba(255,255,255,0.6)', textTransform: 'none', fontWeight: 700, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } };
const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const meta = (value) => DECISIONS.find((d) => d.value === String(value || '').toLowerCase()) || null;
const decisionLabel = (value) => DONE_LABEL[String(value || '').toLowerCase()] || humanizeStatus(value);

const STAGE_TONE = { APPROVED: 'success', APPROVED_WITH_CONTINGENCIES: 'warning', DISAPPROVED: 'danger', DEFERRED: 'warning', IN_PROGRESS: 'info', SKIPPED: 'neutral', NOT_STARTED: 'neutral' };

function PipelineStages({ tracking }) {
  const stages = [...(tracking?.pipeline?.stages || [])].sort((a, b) => a.order - b.order);
  const progress = new Map((tracking?.stageProgress || []).map((p) => [p.stageId, p]));
  if (!stages.length) return <Typography variant="body2" color="text.secondary">This pipeline has no stages.</Typography>;
  return (
    <Stack spacing={0}>
      {stages.map((st, i) => {
        const pr = progress.get(st.id);
        const status = pr?.status || 'NOT_STARTED';
        const current = tracking.overallStatus !== 'COMPLETED' && st.order === tracking.currentStageOrder;
        const done = ['APPROVED', 'APPROVED_WITH_CONTINGENCIES', 'SKIPPED'].includes(status);
        return (
          <Stack key={st.id} direction="row" spacing={1.25}>
            <Stack alignItems="center" sx={{ width: 20 }}>
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', mt: 0.25, display: 'grid', placeItems: 'center', fontSize: '0.65rem', fontWeight: 800, color: done || current ? 'white' : '#64748b', bgcolor: done ? '#10b981' : current ? PURPLE : 'white', border: `2px solid ${done ? '#10b981' : current ? PURPLE : '#cbd5e1'}` }}>{done ? '✓' : i + 1}</Box>
              {i < stages.length - 1 ? <Box sx={{ width: 2, flex: 1, minHeight: 14, bgcolor: done ? '#a7f3d0' : '#e5e7eb' }} /> : null}
            </Stack>
            <Box sx={{ flex: 1, minWidth: 0, pb: i < stages.length - 1 ? 1.25 : 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: current ? 800 : 600, color: INK, flex: 1, minWidth: 0 }} noWrap>{st.name}</Typography>
                <StatusPill label={humanizeStatus(status)} tone={STAGE_TONE[status] || 'neutral'} dot={false} />
              </Stack>
              {pr?.completedAt || pr?.reviewedAt ? <Typography variant="caption" color="text.secondary">{fmt(pr.completedAt || pr.reviewedAt)}</Typography> : current ? <Typography variant="caption" sx={{ color: PURPLE, fontWeight: 700 }}>Current stage</Typography> : null}
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

function CardHead({ icon, title, subtitle, action }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.75 }}>
      <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: alpha(PURPLE, 0.1), color: PURPLE, display: 'grid', placeItems: 'center', flexShrink: 0, '& svg': { fontSize: 18 } }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, color: INK, lineHeight: 1.2 }}>{title}</Typography>
        {subtitle ? <Typography variant="caption" color="text.secondary">{subtitle}</Typography> : null}
      </Box>
      {action}
    </Stack>
  );
}

/**
 * Proposal review workspace for the research office: decision, review pipeline and
 * reviewers at the top, review history, then the proposal laid out like the project page.
 */
export default function InstitutionProposalReviewDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const [proposalRes, trackingRes, reviewersRes, reviewsRes] = await Promise.all([
        fetch(`/api/proposals/${params.id}`),
        fetch(`/api/proposals/${params.id}/review-status`),
        fetch(`/api/proposals/${params.id}/reviewers`),
        fetch(`/api/proposals/${params.id}/review`),
      ]);
      const data = await proposalRes.json();
      if (!proposalRes.ok || !data.success) throw new Error(data.error || 'Failed to load proposal');
      setProposal(data.proposal);
      if (trackingRes.ok) setTracking((await trackingRes.json()).tracking || null);
      if (reviewersRes.ok) setReviewers((await reviewersRes.json()).assignedReviewers || []);
      if (reviewsRes.ok) setReviews((await reviewsRes.json()).reviews || []);
    } catch (err) {
      setError(err.message);
    }
  }, [params.id]);

  useEffect(() => { if (params.id) load(); }, [params.id, load]);

  const crumbs = [{ label: 'Home', icon: <HomeIcon sx={{ fontSize: 16 }} />, path: '/institution' }, { label: 'Proposal review', path: '/institution/proposals/review' }];
  const back = () => router.push('/institution/proposals/review');

  if (!proposal) {
    return (
      <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
        <PageHeader compact title="Proposal review" icon={<ReviewIcon sx={{ fontSize: 28 }} />} breadcrumbs={crumbs} />
        <Container maxWidth={false} sx={{ py: 4, maxWidth: '1600px', mx: 'auto' }}>
          {error ? (
            <Stack spacing={2} alignItems="flex-start">
              <Alert severity="error" action={<Button size="small" onClick={load}>Retry</Button>}>{error}</Alert>
              <Button startIcon={<BackIcon />} onClick={back} sx={{ color: PURPLE, textTransform: 'none', fontWeight: 700 }}>Back to proposal review</Button>
            </Stack>
          ) : <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress sx={{ color: PURPLE }} /></Box>}
        </Container>
      </Box>
    );
  }

  const decided = DECIDED.has(proposal.status);
  const sorted = [...reviews].sort((a, b) => new Date(b.reviewDate || 0) - new Date(a.reviewDate || 0));
  const latest = sorted[0] || null;
  const reviewerName = `${user?.givenName || ''} ${user?.familyName || ''}`.trim() || user?.email || 'Research administrator';
  const nextStep = decided
    ? 'Decision recorded. The researcher has been notified.'
    : proposal.status === 'REVISION_REQUESTED'
      ? 'Waiting for the researcher to revise and resubmit.'
      : !reviewers.length
        ? 'Next: invite reviewers, or record a decision directly.'
        : 'Next: wait for reviewers, then record a decision.';

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <PageHeader
        compact
        clampTitle
        title={proposal.title}
        crumbLabel="Review"
        description={`PI: ${proposal.principalInvestigator || 'not set'} · Submitted ${fmt(proposal.createdAt)}`}
        meta={<ProposalHeaderMeta proposal={proposal} />}
        icon={<ReviewIcon sx={{ fontSize: 28 }} />}
        breadcrumbs={crumbs}
        actionButton={(
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="contained" startIcon={<BackIcon />} onClick={back} sx={whiteBtn}>Back</Button>
            <Button variant="outlined" startIcon={<ProjectIcon />} onClick={() => router.push(`/institution/projects/${proposal.id}`)} sx={ghostBtn}>Project page</Button>
          </Stack>
        )}
      />

      <Container maxWidth={false} sx={{ py: 3, maxWidth: '1600px', mx: 'auto' }}>
        <Stack spacing={2.5}>
          {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
          {notice ? <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert> : null}

          {/* Review workspace */}
          <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', xl: '1.1fr 1.2fr 1fr' } }}>
            <Paper sx={{ ...cardSx, borderTop: `4px solid ${decided ? (proposal.status === 'APPROVED' ? '#10b981' : '#ef4444') : PURPLE}` }}>
              <CardHead icon={<DecisionIcon />} title="Decision" subtitle={nextStep} />
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="body2" color="text.secondary">Status</Typography>
                <StatusPill label={humanizeStatus(proposal.status)} tone={PROPOSAL_STATUS_TONE[proposal.status] || 'neutral'} />
              </Stack>
              {latest ? (
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: meta(latest.decision)?.bg || '#f8fafc', border: '1px solid', borderColor: 'divider', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: meta(latest.decision)?.color || INK }}>{decisionLabel(latest.decision)}</Typography>
                  <Typography variant="caption" color="text.secondary">{latest.reviewerName || 'Research administrator'} · {fmt(latest.reviewDate)}</Typography>
                  {latest.overallComments ? <Typography variant="body2" sx={{ mt: 0.75, color: '#334155', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>{latest.overallComments}</Typography> : null}
                </Box>
              ) : <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>No decision recorded yet.</Typography>}
              <Button fullWidth variant="contained" startIcon={<DecisionIcon />} onClick={() => setDecisionOpen(true)} sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PURPLE, boxShadow: 'none', '&:hover': { bgcolor: '#7a5cb0', boxShadow: 'none' } }}>
                {decided ? 'Record a new decision' : 'Record decision'}
              </Button>
            </Paper>

            <Paper sx={cardSx}>
              <CardHead icon={<ReviewIcon />} title="Review pipeline" subtitle={tracking?.pipeline?.name || 'Stages this proposal goes through'} />
              {tracking?.pipeline ? <PipelineStages tracking={tracking} /> : <Typography variant="body2" color="text.secondary">No review pipeline assigned. You can still invite reviewers and record a decision.</Typography>}
            </Paper>

            <Paper sx={cardSx}>
              <CardHead
                icon={<InvitedIcon />}
                title="Reviewers"
                subtitle={reviewers.length ? `${reviewers.length} invited` : 'None invited yet'}
                action={decided ? null : <Button size="small" startIcon={<InviteIcon />} onClick={() => setInviteOpen(true)} sx={{ textTransform: 'none', fontWeight: 700, color: PURPLE }}>Invite</Button>}
              />
              {reviewers.length ? (
                <Stack spacing={0.75}>
                  {reviewers.map((email) => (
                    <Stack key={email} direction="row" spacing={1} alignItems="center" sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                      <Avatar sx={{ width: 26, height: 26, fontSize: '0.7rem', bgcolor: alpha(PURPLE, 0.15), color: PURPLE, fontWeight: 700 }}>{email.slice(0, 1).toUpperCase()}</Avatar>
                      <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>{email}</Typography>
                      {reviews.some((r) => String(r.reviewerEmail || '').toLowerCase() === email.toLowerCase())
                        ? <Chip size="small" label="Reviewed" sx={{ height: 20, fontWeight: 700, bgcolor: '#dcfce7', color: '#166534' }} />
                        : <Chip size="small" label="Invited" sx={{ height: 20, fontWeight: 700 }} />}
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {decided ? 'The proposal has been decided, so no more reviewers can be invited.' : 'Invite internal or external reviewers by email. They get a secure link to this proposal.'}
                </Typography>
              )}
            </Paper>
          </Box>

          {sorted.length ? (
            <Paper sx={cardSx}>
              <CardHead icon={<HistoryIcon />} title="Review history" subtitle={`${sorted.length} review${sorted.length === 1 ? '' : 's'} and decisions, newest first`} />
              <Stack spacing={1.25}>
                {sorted.map((r) => {
                  const m = meta(r.decision);
                  return (
                    <Box key={r.id} sx={{ p: 1.75, border: '1px solid', borderColor: 'divider', borderLeft: `4px solid ${m?.color || PURPLE}`, borderRadius: 1.5 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip size="small" label={decisionLabel(r.decision)} sx={{ fontWeight: 700, bgcolor: m?.bg || alpha(PURPLE, 0.1), color: m?.color || PURPLE }} />
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{r.reviewerName || 'Reviewer'}</Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">{fmt(r.reviewDate)}</Typography>
                      </Stack>
                      {r.overallComments ? <Typography variant="body2" sx={{ mt: 1, color: '#334155', whiteSpace: 'pre-wrap' }}>{r.overallComments}</Typography> : null}
                      {r.revisionRequirements ? (
                        <Box sx={{ mt: 1, p: 1.25, borderRadius: 1, bgcolor: '#fffbeb' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#92400e' }}>Changes requested</Typography>
                          <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap' }}>{r.revisionRequirements}</Typography>
                        </Box>
                      ) : null}
                      {r.rejectionReason ? (
                        <Box sx={{ mt: 1, p: 1.25, borderRadius: 1, bgcolor: '#fef2f2' }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#991b1b' }}>Reason for rejection</Typography>
                          <Typography variant="body2" sx={{ color: '#334155', whiteSpace: 'pre-wrap' }}>{r.rejectionReason}</Typography>
                        </Box>
                      ) : null}
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          ) : null}

          <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 800, letterSpacing: '0.08em', pt: 1 }}>The proposal</Typography>
          <ProposalOverview
            proposal={proposal}
            audience="institution"
            ethicsHref={(id) => `/institution/ethics/review/${id}`}
            budgetHref={`/institution/projects/budget?project=${proposal.id}`}
            profileHref={(userId) => `/institution/researcher/${userId}`}
            profileSummaryUrl={(userId) => `/api/institution/researchers/${userId}?summary=1`}
          />
        </Stack>
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
          setNotice(`Decision saved (${decisionLabel(decision)}). The researcher has been notified by email and in-app notification.`);
          await load();
        }}
      />
    </Box>
  );
}
