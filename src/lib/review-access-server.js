import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { PROPOSAL_ACCESS_SELECT, canAccessProposal } from '@/lib/proposals/visibility';
import { isPersonallyInvolved } from '@/lib/proposals/scope';
import { canUseManuscript, isAssignedProposalReviewer, proposalReviewPermissions } from '@/lib/review-access';

export const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
export const forbidden = (message = 'Forbidden') => NextResponse.json({ error: message }, { status: 403 });
export const notFound = (message = 'Not found') => NextResponse.json({ error: message }, { status: 404 });

/**
 * Session user plus what they may do on one proposal's review (#6). Returns `{ error }`
 * with 401 (no session) or 404 (proposal missing, or the user may not even read it,
 * so its existence is not revealed).
 * @returns {Promise<{ error } | { user, proposal, perms, stageProgress }>}
 */
export async function proposalReviewContext(request, proposalId) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: unauthorized() };
  if (!proposalId) return { error: NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 }) };

  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, select: PROPOSAL_ACCESS_SELECT });
  if (!proposal) return { error: notFound('Proposal not found') };

  const [inScope, tracking] = await Promise.all([
    canAccessProposal(user, proposal),
    prisma.proposalReviewTracking.findUnique({
      where: { proposalId },
      select: { stageProgress: { select: { id: true, stageId: true, assignedReviewers: true, stage: { select: { id: true, reviewerEmails: true } } } } },
    }),
  ]);
  const stageProgress = tracking?.stageProgress || [];
  const perms = proposalReviewPermissions(user, {
    inScope,
    involved: isPersonallyInvolved(user, proposal),
    assigned: isAssignedProposalReviewer(user, stageProgress),
  });
  if (!perms.read && !perms.reviewStage && !perms.submit) return { error: notFound('Proposal not found') };
  return { user, proposal, perms, stageProgress };
}

/** Session user, or a 401 response. */
export async function sessionUser(request) {
  const user = await getAuthenticatedUser(request);
  return user ? { user } : { error: unauthorized() };
}

/**
 * Session user who is the creator or a collaborator of a manuscript, or `{ error }`
 * (401 without a session, 404 otherwise so manuscripts are not revealed).
 */
export async function manuscriptMember(request, manuscriptId) {
  const user = await getAuthenticatedUser(request);
  if (!user) return { error: unauthorized() };
  const manuscript = manuscriptId
    ? await prisma.manuscript.findUnique({ where: { id: manuscriptId }, select: { id: true, createdBy: true, collaborators: { select: { userId: true } } } })
    : null;
  if (!canUseManuscript(user, manuscript)) return { error: notFound('Manuscript not found') };
  return { user, manuscript };
}
