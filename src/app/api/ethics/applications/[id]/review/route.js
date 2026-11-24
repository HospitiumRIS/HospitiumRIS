import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { forbidden, sessionUser } from '@/lib/review-access-server';
import { canDecideEthics, reviewerIdentity } from '@/lib/review-access';
import { staffSharesTenantWithEthicsApplication } from '@/lib/tenant';

const DECISIONS = ['APPROVED', 'CONDITIONAL_APPROVAL', 'REJECTED', 'REVISION_REQUESTED'];

/**
 * POST - Record an ethics decision (#6). Research office of the applicant's institution
 * only, never on their own application; the reviewer is the signed-in user.
 */
export async function POST(request, { params }) {
  try {
    const auth = await sessionUser(request);
    if (auth.error) return auth.error;
    const { id } = await params;
    const data = await request.json().catch(() => ({}));
    if (!DECISIONS.includes(data.decision)) {
      return NextResponse.json({ success: false, error: `Decision must be one of ${DECISIONS.join(', ')}` }, { status: 400 });
    }

    const application = await prisma.ethicsApplication.findUnique({
      where: { id }
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Ethics application not found' },
        { status: 404 }
      );
    }

    const sharesTenant = await staffSharesTenantWithEthicsApplication(prisma, auth.user, application);
    if (!canDecideEthics(auth.user, application, { sharesTenant })) {
      // Other institutions' applications are not revealed.
      if (!sharesTenant && auth.user.accountType !== 'GLOBAL_ADMIN') {
        return NextResponse.json({ success: false, error: 'Ethics application not found' }, { status: 404 });
      }
      return forbidden('Only the research office of the applicant\'s institution can record a decision, and not on its own application');
    }
    const identity = reviewerIdentity(auth.user);

    // Create review
    const review = await prisma.ethicsReview.create({
      data: {
        ethicsApplicationId: id,
        reviewerId: identity.reviewerId,
        reviewerName: identity.reviewerName,
        reviewerRole: typeof data.reviewerRole === 'string' ? data.reviewerRole.slice(0, 100) : 'Research office',
        decision: data.decision,
        overallComments: data.overallComments,
        ethicalConcerns: data.ethicalConcerns,
        riskAssessmentReview: data.riskAssessmentReview,
        consentReview: data.consentReview,
        dataProtectionReview: data.dataProtectionReview,
        recommendations: data.recommendations,
        conditions: data.conditions,
        reviewDate: new Date()
      }
    });

    // Update application status based on decision
    let newStatus = application.status;
    let updateData = { reviewDate: new Date() };

    if (data.decision === 'APPROVED') {
      newStatus = 'APPROVED';
      updateData.status = 'APPROVED';
      updateData.approvalDate = new Date();
      // Set expiry date to 1 year from approval
      updateData.expiryDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    } else if (data.decision === 'CONDITIONAL_APPROVAL') {
      newStatus = 'CONDITIONAL_APPROVAL';
      updateData.status = 'CONDITIONAL_APPROVAL';
      updateData.approvalConditions = data.conditions;
    } else if (data.decision === 'REJECTED') {
      newStatus = 'REJECTED';
      updateData.status = 'REJECTED';
    } else if (data.decision === 'REVISION_REQUESTED') {
      newStatus = 'REVISION_REQUESTED';
      updateData.status = 'REVISION_REQUESTED';
    }

    const updatedApplication = await prisma.ethicsApplication.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      review,
      application: updatedApplication,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting ethics review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
