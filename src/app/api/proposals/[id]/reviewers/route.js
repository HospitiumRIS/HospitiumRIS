import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../../../../lib/auth-server.js';
import { findAccessibleProposal } from '../../../../../lib/proposals/visibility.js';
import { isGlobalAdmin, isProposalAdmin } from '../../../../../lib/proposals/scope.js';

/** Reviewer assignments are managed by the owning institution's research office. */
async function authorizeReviewerAdmin(request, id) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!isGlobalAdmin(auth.user) && !isProposalAdmin(auth.user)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  if (!(await findAccessibleProposal(auth.user, id))) {
    return { error: NextResponse.json({ error: 'Proposal not found' }, { status: 404 }) };
  }
  return { user: auth.user };
}
import { assignProposalReviewers, getCurrentStageProgress } from '../../../../../lib/proposal-review-comms.js';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const auth = await authorizeReviewerAdmin(request, id);
    if (auth.error) return auth.error;
    const stageInfo = await getCurrentStageProgress(prisma, id);
    return NextResponse.json({
      success: true,
      assignedReviewers: stageInfo?.current?.assignedReviewers || [],
      stage: stageInfo?.current?.stage || null,
      tracking: stageInfo?.tracking
        ? {
            currentStageOrder: stageInfo.tracking.currentStageOrder,
            overallStatus: stageInfo.tracking.overallStatus,
          }
        : null,
    });
  } catch (error) {
    console.error('Error loading proposal reviewers:', error);
    return NextResponse.json({ error: 'Failed to load reviewers' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const auth = await authorizeReviewerAdmin(request, id);
    if (auth.error) return auth.error;
    const body = await request.json();
    const emails = Array.isArray(body.emails) ? body.emails : String(body.emails || '').split(/[,\s]+/);
    const invitedByName = `${auth.user.givenName || ''} ${auth.user.familyName || ''}`.trim()
      || auth.user.email
      || 'Research administration';

    const result = await assignProposalReviewers(prisma, id, {
      emails,
      invitedByName,
      invitedById: auth.user.id,
      message: body.message || '',
    });

    return NextResponse.json({
      success: true,
      ...result,
      message: 'Reviewer invitations sent',
    });
  } catch (error) {
    console.error('Error assigning proposal reviewers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign reviewers' },
      { status: error.message?.includes('valid reviewer email') ? 400 : 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
