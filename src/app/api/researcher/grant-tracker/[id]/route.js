import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-server';
import {
  colleaguesWhere,
  findGrantTrackerProposal,
  saveGrantTrackerProposal,
  validateGrantTrackerUpdate,
} from '@/lib/grant-tracker';

export async function PATCH(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const proposal = await findGrantTrackerProposal(id, user);

    if (!proposal) {
      return NextResponse.json({ error: 'Approved proposal not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = validateGrantTrackerUpdate({
      grantTrackingStatus: body.grantTrackingStatus ?? proposal.grantTrackingStatus,
      grantRequestedAmount:
        body.grantRequestedAmount !== undefined
          ? body.grantRequestedAmount
          : proposal.grantRequestedAmount,
      grantAppliedOn:
        body.grantAppliedOn !== undefined
          ? body.grantAppliedOn
          : proposal.grantAppliedOn,
      grantFollowUpUserId:
        body.grantFollowUpUserId !== undefined
          ? body.grantFollowUpUserId
          : proposal.grantFollowUpUserId,
      grantTrackingNotes:
        body.grantTrackingNotes !== undefined
          ? body.grantTrackingNotes
          : proposal.grantTrackingNotes,
    });

    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (parsed.followUpUserId) {
      const assignee = await prisma.user.findFirst({
        where: {
          AND: [{ id: parsed.followUpUserId }, colleaguesWhere(user)],
        },
        select: { id: true },
      });
      if (!assignee) {
        return NextResponse.json(
          { error: 'Follow-up assignee must be an active colleague at your institution' },
          { status: 400 }
        );
      }
    }

    const historyEntry = {
      status: parsed.status,
      requestedAmount: parsed.amount,
      appliedOn: parsed.appliedOn ? parsed.appliedOn.toISOString() : null,
      followUpUserId: parsed.followUpUserId,
      notes: parsed.notes || null,
      updatedAt: new Date().toISOString(),
      updatedBy: {
        id: user.id,
        name: [user.givenName, user.familyName].filter(Boolean).join(' ').trim() || user.email,
      },
    };

    const updated = await saveGrantTrackerProposal(id, parsed, {
      previousStatus: proposal.grantTrackingStatus,
      previousDecisionOn: proposal.grantDecisionOn,
      historyEntry,
      user,
    });

    return NextResponse.json({
      success: true,
      proposal: updated,
    });
  } catch (error) {
    console.error('Error updating grant tracker:', error);
    return NextResponse.json({ error: 'Failed to update grant tracking' }, { status: 500 });
  }
}
