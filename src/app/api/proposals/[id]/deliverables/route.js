import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-server';
import { canAccessProposal } from '@/lib/proposals/visibility';
import { isPersonallyInvolved, isProposalAdmin } from '@/lib/proposals/scope';
import { setDeliverableDelivered } from '@/lib/proposal-progress';

/**
 * PATCH /api/proposals/[id]/deliverables { deliverableId, index?, delivered, note? }
 * Mark a deliverable of an approved project as delivered (or undo). Allowed for the
 * people on the project and the research office of its institution.
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const auth = await requireAuth(request);
    if (auth.error) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal || !(await canAccessProposal(auth.user, proposal))) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }
    if (!isProposalAdmin(auth.user) && !isPersonallyInvolved(auth.user, proposal)) {
      return NextResponse.json({ error: 'Only the project team or the research office can update deliverables' }, { status: 403 });
    }
    if (proposal.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Deliverables can be marked once the project is approved' }, { status: 409 });
    }
    const body = await request.json().catch(() => ({}));
    const result = setDeliverableDelivered(proposal.deliverables, {
      id: typeof body.deliverableId === 'string' ? body.deliverableId : null,
      index: Number.isInteger(body.index) ? body.index : null,
      delivered: body.delivered !== false,
      note: body.note,
      user: auth.user,
    });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    await prisma.proposal.update({ where: { id }, data: { deliverables: result.deliverables } });
    return NextResponse.json({ success: true, deliverable: result.deliverable, deliverables: result.deliverables });
  } catch (error) {
    console.error('Updating deliverable failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
