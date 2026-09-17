/**
 * Attach pending manuscript invitations to a newly registered or logging-in user
 * and create in-app notifications when they did not already have an account.
 */
export async function claimPendingInvitations(db, user) {
  if (!user?.id) return 0;

  const email = user.email?.toLowerCase() || null;
  const orcidId = user.orcidId || null;
  if (!email && !orcidId) return 0;

  const invitations = await db.manuscriptInvitation.findMany({
    where: {
      status: 'PENDING',
      expiresAt: { gt: new Date() },
      OR: [
        ...(email
          ? [
              { email: { equals: email, mode: 'insensitive' } },
              { invitedUserId: user.id },
            ]
          : []),
        ...(orcidId ? [{ orcidId }] : []),
      ],
    },
    include: {
      manuscript: {
        select: { id: true, title: true, type: true },
      },
      inviter: {
        select: { givenName: true, familyName: true },
      },
    },
  });

  let claimed = 0;

  for (const invitation of invitations) {
    if (invitation.invitedUserId && invitation.invitedUserId !== user.id) {
      continue;
    }

    // Already linked at invite time (existing user) — they already have a notification.
    if (invitation.invitedUserId === user.id) {
      continue;
    }

    await db.manuscriptInvitation.update({
      where: { id: invitation.id },
      data: {
        invitedUserId: user.id,
        email: email || invitation.email,
      },
    });

    const inviterName =
      `${invitation.inviter?.givenName || ''} ${invitation.inviter?.familyName || ''}`.trim() ||
      'A colleague';
    const isProposal = invitation.manuscript?.type?.toLowerCase().includes('proposal');
    const documentType = isProposal ? 'research proposal' : 'manuscript';

    await db.notification.create({
      data: {
        userId: user.id,
        manuscriptId: invitation.manuscriptId,
        type: 'COLLABORATION_INVITATION',
        title: isProposal ? 'Research Proposal Invitation' : 'Manuscript Collaboration Invitation',
        message: `${inviterName} has invited you to collaborate on the ${documentType} "${invitation.manuscript.title}" as ${invitation.role}`,
        data: {
          invitationId: invitation.id,
          inviterName,
          manuscriptTitle: invitation.manuscript.title,
          role: invitation.role,
          action: 'pending',
          documentType,
        },
      },
    });
    claimed += 1;
  }

  return claimed;
}
