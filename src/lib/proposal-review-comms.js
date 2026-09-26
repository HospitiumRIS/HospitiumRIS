import notificationService from '../services/notificationService.js';
import { sendProposalReviewInviteEmail, sendProposalStatusEmail } from './email.js';
import { ensureProposalInReviewPipeline } from './proposal-review-pipeline.js';

const APP_URL = process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';

const STATUS_LABELS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Not approved',
  REVISION_REQUESTED: 'Revision requested',
};

function normalizeEmails(emails = []) {
  return [...new Set(
    emails
      .map((email) => String(email || '').trim().toLowerCase())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )];
}

export async function findProposalOwner(client, proposal) {
  if (!proposal) return null;
  const select = { id: true, email: true, givenName: true, familyName: true };
  const orcid = proposal.principalInvestigatorOrcid;
  if (orcid) {
    const byOrcid = await client.user.findFirst({
      where: { orcidId: orcid },
      select,
    });
    if (byOrcid) return byOrcid;
  }

  const ethicsLink = await client.proposalEthicsLink.findFirst({
    where: { proposalId: proposal.id },
    include: { ethicsApplication: { select: { userId: true } } },
    orderBy: { linkedDate: 'desc' },
  });
  if (ethicsLink?.ethicsApplication?.userId) {
    const byEthics = await client.user.findUnique({
      where: { id: ethicsLink.ethicsApplication.userId },
      select,
    });
    if (byEthics) return byEthics;
  }

  return null;
}

export async function notifyProposalOwner(client, proposal, {
  templateKey,
  statusLabel,
  details,
  actionUrl,
} = {}) {
  const owner = await findProposalOwner(client, proposal);
  if (!owner) return { notified: false };

  const label = statusLabel || STATUS_LABELS[proposal.status] || proposal.status;
  const viewUrl = actionUrl || `${APP_URL}/researcher/projects/proposals/view/${proposal.id}`;

  try {
    await notificationService.createFromTemplate(templateKey || 'PROPOSAL_STATUS_CHANGED', {
      userId: owner.id,
      proposalId: proposal.id,
      proposalTitle: proposal.title,
      statusLabel: label,
      details,
      reason: details,
      requirements: details,
      actionUrl: `/researcher/projects/proposals/view/${proposal.id}`,
      sendEmail: false,
    });
  } catch (error) {
    console.error('Failed to create proposal owner notification:', error);
  }

  if (owner.email) {
    await sendProposalStatusEmail({
      to: owner.email,
      recipientName: `${owner.givenName || ''} ${owner.familyName || ''}`.trim(),
      proposalTitle: proposal.title,
      statusLabel: label,
      details,
      actionUrl: viewUrl,
    });
  }

  return { notified: true, ownerId: owner.id };
}

export async function getCurrentStageProgress(client, proposalId) {
  const proposal = await client.proposal.findUnique({
    where: { id: proposalId },
    select: { status: true },
  });
  await ensureProposalInReviewPipeline(client, proposalId, {
    status: proposal?.status === 'DRAFT' ? 'UNDER_REVIEW' : (proposal?.status || 'UNDER_REVIEW'),
  });
  const tracking = await client.proposalReviewTracking.findUnique({
    where: { proposalId },
    include: {
      pipeline: { include: { stages: { orderBy: { order: 'asc' } } } },
      stageProgress: { include: { stage: true }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!tracking) return null;
  const current = tracking.stageProgress.find((item) => item.stageId === tracking.currentStageId)
    || tracking.stageProgress.find((item) => item.stage?.order === tracking.currentStageOrder)
    || tracking.stageProgress[0];
  return { tracking, current };
}

export async function assignProposalReviewers(client, proposalId, {
  emails,
  invitedByName,
  invitedById,
  message,
} = {}) {
  const uniqueEmails = normalizeEmails(emails);
  if (!uniqueEmails.length) {
    throw new Error('Add at least one valid reviewer email');
  }

  const proposal = await client.proposal.findUnique({ where: { id: proposalId } });
  if (!proposal) throw new Error('Proposal not found');

  const stageInfo = await getCurrentStageProgress(client, proposalId);
  if (!stageInfo?.current) throw new Error('Review pipeline is not available');

  const existing = Array.isArray(stageInfo.current.assignedReviewers)
    ? stageInfo.current.assignedReviewers
    : [];
  const assignedReviewers = [...new Set([...existing, ...uniqueEmails])];

  await client.proposalStageProgress.update({
    where: { id: stageInfo.current.id },
    data: { assignedReviewers },
  });

  const reviewUrl = `${APP_URL}/institution/proposals/review/${proposalId}`;
  const invited = [];

  for (const email of uniqueEmails) {
    const user = await client.user.findUnique({
      where: { email },
      select: { id: true, givenName: true, familyName: true, email: true },
    });
    const reviewerName = user ? `${user.givenName || ''} ${user.familyName || ''}`.trim() : email;

    await sendProposalReviewInviteEmail({
      to: email,
      reviewerName,
      inviterName: invitedByName,
      proposalTitle: proposal.title,
      reviewUrl,
      message,
    });

    if (user) {
      try {
        await notificationService.createFromTemplate('PROPOSAL_REVIEW_ASSIGNED', {
          userId: user.id,
          proposalId,
          proposalTitle: proposal.title,
          submitterName: invitedByName || 'Research administration',
          actionUrl: `/institution/proposals/review/${proposalId}`,
          sendEmail: false,
        });
      } catch (error) {
        console.error('Failed to notify assigned reviewer:', error);
      }
    }

    invited.push({ email, userId: user?.id || null, name: reviewerName });
  }

  await notifyProposalOwner(client, proposal, {
    templateKey: 'PROPOSAL_STATUS_CHANGED',
    statusLabel: 'Under review',
    details: `${uniqueEmails.length} reviewer${uniqueEmails.length === 1 ? '' : 's'} ${uniqueEmails.length === 1 ? 'has' : 'have'} been invited to review this proposal.`,
  });

  return {
    assignedReviewers,
    invited,
    stageId: stageInfo.current.stageId,
    invitedById: invitedById || null,
  };
}
