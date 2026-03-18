import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Submit ethics review
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();

    const application = await prisma.ethicsApplication.findUnique({
      where: { id }
    });

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Ethics application not found' },
        { status: 404 }
      );
    }

    // Create review
    const review = await prisma.ethicsReview.create({
      data: {
        ethicsApplicationId: id,
        reviewerId: data.reviewerId,
        reviewerName: data.reviewerName,
        reviewerRole: data.reviewerRole,
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
