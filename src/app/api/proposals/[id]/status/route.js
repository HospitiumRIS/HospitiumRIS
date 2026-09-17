import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma.js';
import { getUserId } from '../../../../../lib/auth-server.js';

const PROJECT_TO_PROPOSAL_STATUS = {
  Planning: 'DRAFT',
  Active: 'APPROVED',
  Review: 'UNDER_REVIEW',
  'On Hold': 'REVISION_REQUESTED',
  Completed: 'APPROVED',
};

export async function PATCH(request, { params }) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { newStatus, reason, notes, effectiveDate } = body;

    if (!newStatus) {
      return NextResponse.json({ error: 'New status is required' }, { status: 400 });
    }

    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const proposalStatus = PROJECT_TO_PROPOSAL_STATUS[newStatus] || 'DRAFT';
    const statusLogEntry = {
      id: `status-${Date.now()}`,
      category: 'status_change',
      fromStatus: body.currentStatus || null,
      toStatus: newStatus,
      proposalStatus,
      reason: reason?.trim() || '',
      notes: notes || '',
      effectiveDate: effectiveDate || new Date().toISOString(),
      changedBy: userId,
      changedAt: new Date().toISOString(),
    };

    const otherRelatedFiles = Array.isArray(proposal.otherRelatedFiles)
      ? [...proposal.otherRelatedFiles, statusLogEntry]
      : [statusLogEntry];

    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: proposalStatus,
        otherRelatedFiles,
      },
    });

    return NextResponse.json({
      success: true,
      status: newStatus,
      proposalStatus: updatedProposal.status,
    });
  } catch (error) {
    console.error('Error updating project status:', error);
    return NextResponse.json(
      { error: 'Failed to update project status', details: error.message },
      { status: 500 }
    );
  }
}
